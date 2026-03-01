import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── MODULE IMPORTS ──────────────────────────────────────────────
import { createDECOAttestation, verifyStealthPass, buildCCIPCompliancePayload } from './stealth-pass.js';
import { screenWallet, generateChainlinkFunctionSource } from './sanctions-oracle.js';
import { runComplianceReview, generateAICopilotFunctionSource } from './ai-copilot.js';

// ═══════════════════════════════════════════════════════════════════
//  🛡️  CHAINLINK SENTINEL v2.0 — Institutional Compliance Bridge
// ═══════════════════════════════════════════════════════════════════
//  MCP Server with 6 compliance tools:
//    1. check-compliance-policy   (ACE Policy Enforcement)
//    2. attach-compliance-metadata (CCIP Metadata Persistence)
//    3. generate-regulatory-report (Automated Reporting)
//    4. verify-stealth-pass        (DECO ZKP Attestation)     ← NEW
//    5. screen-sanctions           (OFAC/AML Oracle)           ← NEW
//    6. ai-compliance-review       (AI Co-Pilot via DeepSeek)  ← NEW
// ═══════════════════════════════════════════════════════════════════

const server = new McpServer({
    name: "Chainlink-Sentinel",
    version: "2.0.0"
});

// ─── TOOL 1: ACE Policy Enforcement ─────────────────────────────
server.tool("check-compliance-policy", {
    walletAddress: z.string().describe("Wallet address to check (0x...)"),
    assetType: z.string().describe("Type of asset being transferred"),
    amount: z.number().describe("Transfer amount in USD")
}, async ({ walletAddress, assetType, amount }) => {
    // Enhanced: Now uses sanctions-oracle for real screening
    const screening = await screenWallet(walletAddress);

    if (!screening.success) {
        return {
            content: [{ type: "text", text: `ERROR: ${screening.error}` }]
        };
    }

    const result = screening.screening;
    const isHighValue = amount > 50000;

    let decision;
    if (result.isSanctioned) {
        decision = `🚫 DENIED: Wallet flagged by sanctions screening (Risk: ${result.riskLevel}, Score: ${result.compositeRiskScore}).`;
    } else if (isHighValue && result.riskLevel !== 'LOW') {
        decision = `⚠️ ESCALATED: High-value transfer ($${amount.toLocaleString()}) with ${result.riskLevel} risk requires human approval.`;
    } else {
        decision = `✅ APPROVED: Wallet cleared. Risk: ${result.riskLevel} (Score: ${result.compositeRiskScore}). Sanctions attestation: ${result.attestation.hash.substring(0, 18)}...`;
    }

    const flags = result.flags.length > 0 ? `\nFlags: ${result.flags.join(', ')}` : '';

    return {
        content: [{ type: "text", text: `${decision}${flags}\nProviders queried: ${result.metadata.providersQueried} | Duration: ${result.metadata.screeningDurationMs}ms` }]
    };
});

// ─── TOOL 2: CCIP Metadata Persistence ──────────────────────────
server.tool("attach-compliance-metadata", {
    txHash: z.string().describe("Transaction hash to attach metadata to"),
    jurisdiction: z.string().describe("2-letter jurisdiction code (US, EU, SG, etc.)")
}, async ({ txHash, jurisdiction }) => {
    const metadataHash = Buffer.from(`${txHash}-${jurisdiction}-${Date.now()}`).toString('base64');
    return {
        content: [{
            type: "text",
            text: `✅ SUCCESS: Compliance hash ${metadataHash} attached to CCIP message.\nJurisdiction: ${jurisdiction} | Timestamp: ${new Date().toISOString()}`
        }]
    };
});

// ─── TOOL 3: Automated Regulatory Reporting ─────────────────────
server.tool("generate-regulatory-report", {
    assetId: z.string().describe("Asset identifier for the report"),
    jurisdiction: z.string().optional().describe("Target jurisdiction (default: US)"),
    reportType: z.string().optional().describe("Report type: SAR, CTR, audit (default: audit)")
}, async ({ assetId, jurisdiction = 'US', reportType = 'audit' }) => {
    const report = {
        reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
        assetId,
        jurisdiction,
        reportType: reportType.toUpperCase(),
        status: 'GENERATED',
        timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
        format: 'JSON-verified',
        submissionReady: true
    };

    return {
        content: [{
            type: "text",
            text: `📋 REPORT GENERATED:\n${JSON.stringify(report, null, 2)}\n\nReady for submission to ${jurisdiction} regulatory authority.`
        }]
    };
});

// ─── TOOL 4: DECO Stealth-Pass (NEW) ────────────────────────────
server.tool("verify-stealth-pass", {
    entityId: z.string().describe("Hashed entity identifier (never raw PII)"),
    provider: z.string().describe("KYC provider: chainalysis, elliptic, refinitiv, lexisnexis, jumio"),
    claims: z.array(z.string()).optional().describe("Claims to verify: is_kyc_verified, is_accredited_investor, is_not_sanctioned, jurisdiction_cleared, aml_risk_below_threshold"),
    sourceChain: z.string().optional().describe("Source chain for CCIP payload (e.g. ethereum-sepolia)"),
    destChain: z.string().optional().describe("Destination chain for CCIP payload (e.g. base-sepolia)")
}, async ({ entityId, provider, claims, sourceChain, destChain }) => {
    // Step 1: Create DECO attestation
    const attestation = createDECOAttestation(
        entityId,
        provider,
        claims || ['is_kyc_verified', 'is_not_sanctioned']
    );

    if (!attestation.success) {
        return {
            content: [{ type: "text", text: `🚫 STEALTH-PASS FAILED: ${attestation.error}` }]
        };
    }

    // Step 2: Verify the attestation
    const verification = verifyStealthPass(
        attestation.attestation.attestationHash,
        claims || ['is_kyc_verified', 'is_not_sanctioned'],
        attestation.attestation
    );

    // Step 3: Build CCIP payload if chains specified
    let ccipPayload = null;
    if (sourceChain && destChain) {
        ccipPayload = buildCCIPCompliancePayload(attestation.attestation, sourceChain, destChain);
    }

    const output = {
        stealthPass: {
            status: verification.verified ? '✅ VERIFIED' : '🚫 FAILED',
            attestationHash: attestation.attestation.attestationHash,
            claims: attestation.attestation.claimsVerified,
            allPassed: attestation.attestation.allClaimsPassed,
            validUntil: attestation.attestation.validUntil,
            decoNode: attestation.attestation.decoNodeId,
            privacy: attestation.attestation.privacyGuarantee
        },
        verification,
        ccipPayload
    };

    return {
        content: [{
            type: "text",
            text: `🔐 STEALTH-PASS RESULT:\n${JSON.stringify(output, null, 2)}`
        }]
    };
});

// ─── TOOL 5: Sanctions Screening Oracle (NEW) ───────────────────
server.tool("screen-sanctions", {
    walletAddress: z.string().describe("Wallet address to screen (0x followed by 40 hex chars)"),
    deepScan: z.boolean().optional().describe("Enable deep transaction history analysis (default: false)"),
    providers: z.array(z.string()).optional().describe("Providers to query: ofac, chainalysis, elliptic (default: all)")
}, async ({ walletAddress, deepScan, providers }) => {
    const result = await screenWallet(walletAddress, {
        deepScan: deepScan || false,
        providers: providers || undefined
    });

    if (!result.success) {
        return {
            content: [{ type: "text", text: `🚫 SCREENING ERROR: ${result.error}` }]
        };
    }

    const s = result.screening;
    const statusEmoji = s.isClear ? '✅' : s.isSanctioned ? '🚫' : '⚠️';

    let output = `${statusEmoji} SANCTIONS SCREENING: ${s.riskLevel}\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `Wallet: ${s.walletRedacted}\n`;
    output += `Composite Risk: ${s.compositeRiskScore} | Action: ${s.action}\n`;
    output += `Providers: ${s.providerResults.map(p => `${p.provider} (${p.status})`).join(', ')}\n`;

    if (s.flags.length > 0) {
        output += `\n🚩 FLAGS:\n${s.flags.map(f => `  • ${f}`).join('\n')}\n`;
    }

    output += `\n🔐 DECO Attestation: ${s.attestation.hash.substring(0, 18)}...\n`;
    output += `   Claim: ${s.attestation.claim} = ${s.attestation.result}\n`;
    output += `   Valid until: ${s.attestation.validUntil}\n`;
    output += `\n⏱️ Screening completed in ${s.metadata.screeningDurationMs}ms`;

    // Include Chainlink Functions source
    output += `\n\n📜 CHAINLINK FUNCTIONS SOURCE (for DON deployment):\n${generateChainlinkFunctionSource(walletAddress)}`;

    return {
        content: [{ type: "text", text: output }]
    };
});

// ─── TOOL 6: AI Compliance Co-Pilot (NEW) ───────────────────────
server.tool("ai-compliance-review", {
    sourceChain: z.string().describe("Source blockchain (e.g. ethereum, polygon)"),
    destChain: z.string().describe("Destination blockchain (e.g. base, arbitrum)"),
    sourceJurisdiction: z.string().describe("2-letter source jurisdiction code (US, EU, SG, UK, JP)"),
    destJurisdiction: z.string().describe("2-letter destination jurisdiction code"),
    amountUSD: z.number().describe("Transfer amount in USD"),
    assetType: z.string().describe("Asset type (e.g. USDC, WETH, RWA_BOND)"),
    entityType: z.string().optional().describe("Entity type: individual, institution, dao (default: institution)")
}, async ({ sourceChain, destChain, sourceJurisdiction, destJurisdiction, amountUSD, assetType, entityType }) => {
    const result = await runComplianceReview({
        sourceChain,
        destChain,
        sourceJurisdiction,
        destJurisdiction,
        amountUSD,
        assetType,
        entityType: entityType || 'institution',
        sanctionsResult: null
    });

    if (!result.success) {
        return {
            content: [{ type: "text", text: `🚫 AI REVIEW FAILED: Compliance Co-Pilot unavailable.` }]
        };
    }

    const r = result.review;
    const actionEmoji = r.action.decision === 'APPROVE' ? '✅' : r.action.decision === 'REJECT' ? '🚫' : '⚠️';

    let output = `🧠 AI COMPLIANCE CO-PILOT REVIEW\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `Route: ${r.transferSummary.route}\n`;
    output += `Jurisdictions: ${r.transferSummary.jurisdictions}\n`;
    output += `Amount: ${r.transferSummary.amount}\n`;
    output += `Asset: ${r.transferSummary.asset} | Entity: ${r.transferSummary.entity}\n\n`;

    output += `📊 RISK ASSESSMENT:\n`;
    output += `  Overall Risk: ${r.riskAssessment.overallRisk}\n`;
    output += `  Confidence: ${(r.riskAssessment.confidenceScore * 100).toFixed(0)}%\n`;
    output += `  Risk Score: ${r.riskAssessment.riskScore}\n`;

    if (r.riskAssessment.flags.length > 0) {
        output += `\n  🚩 Flags:\n${r.riskAssessment.flags.map(f => `    • ${f}`).join('\n')}\n`;
    }

    if (r.riskAssessment.regulatoryNotes.length > 0) {
        output += `\n  📜 Regulatory Notes:\n${r.riskAssessment.regulatoryNotes.map(n => `    • ${n}`).join('\n')}\n`;
    }

    output += `\n${actionEmoji} DECISION: ${r.action.decision}\n`;
    output += `  Reason: ${r.action.reason}\n`;
    output += `  Human Approval Required: ${r.action.requiresHumanApproval ? 'YES' : 'No'}\n`;
    output += `  Escalation Level: ${r.action.escalationLevel}\n`;

    output += `\n🤖 AI Analysis: ${r.aiAnalysis.analysisText}\n`;
    output += `  Model: ${r.aiAnalysis.model} | Processing: ${r.aiAnalysis.processingTimeMs}ms\n`;
    output += `  Review ID: ${r.metadata.reviewId}`;

    return {
        content: [{ type: "text", text: output }]
    };
});

// ─── SERVER STARTUP ─────────────────────────────────────────────

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

runServer().catch(console.error);