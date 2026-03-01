/**
 * ═══════════════════════════════════════════════════════════════════
 *  🧪 SENTINEL v2.0 — Integration Test Suite
 * ═══════════════════════════════════════════════════════════════════
 *  Tests all 3 new capabilities:
 *    1. DECO Stealth-Pass attestation + verification
 *    2. Sanctions Screening Oracle (multi-provider)
 *    3. AI Compliance Co-Pilot (fallback mode, no Vertex needed)
 */

import { createDECOAttestation, verifyStealthPass, buildCCIPCompliancePayload } from './stealth-pass.js';
import { screenWallet, generateChainlinkFunctionSource } from './sanctions-oracle.js';
import { runComplianceReview } from './ai-copilot.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${testName}`);
        failed++;
    }
}

async function main() {
    console.log('═'.repeat(70));
    console.log('🧪 CHAINLINK SENTINEL v2.0 — INTEGRATION TEST SUITE');
    console.log('═'.repeat(70));
    console.log();

    // ─── TEST 1: DECO STEALTH-PASS ──────────────────────────────
    console.log('─'.repeat(70));
    console.log('🔐 TEST 1: DECO Stealth-Pass');
    console.log('─'.repeat(70));

    // 1a: Create attestation
    const attestation = createDECOAttestation(
        'entity-hash-abc123',
        'chainalysis',
        ['is_kyc_verified', 'is_not_sanctioned']
    );
    assert(attestation.success === true, 'Attestation created successfully');
    assert(attestation.attestation.attestationHash.startsWith('0x'), 'Attestation hash has 0x prefix');
    assert(attestation.attestation.allClaimsPassed === true, 'All claims passed');
    assert(attestation.attestation.claimsVerified.length === 2, 'Correct number of claims verified');
    assert(attestation.attestation.decoNodeId.startsWith('deco-node-'), 'DECO node assigned');

    // 1b: Verify attestation
    const verification = verifyStealthPass(
        attestation.attestation.attestationHash,
        ['is_kyc_verified', 'is_not_sanctioned'],
        attestation.attestation
    );
    assert(verification.verified === true, 'Attestation verified successfully');
    assert(verification.reason === 'ALL_CHECKS_PASSED', 'Verification reason correct');

    // 1c: Reject bad attestation hash
    const badVerification = verifyStealthPass(
        '0xdeadbeef',
        ['is_kyc_verified'],
        attestation.attestation
    );
    assert(badVerification.verified === false, 'Rejects mismatched attestation hash');
    assert(badVerification.reason === 'ATTESTATION_MISMATCH', 'Correct rejection reason');

    // 1d: Invalid provider
    const badProvider = createDECOAttestation('entity-123', 'fake_provider', ['is_kyc_verified']);
    assert(badProvider.success === false, 'Rejects unsupported provider');

    // 1e: CCIP payload
    const ccipPayload = buildCCIPCompliancePayload(
        attestation.attestation,
        'ethereum-sepolia',
        'base-sepolia'
    );
    assert(ccipPayload.type === 'STEALTH_PASS_CCIP_PAYLOAD', 'CCIP payload type correct');
    assert(ccipPayload.privacyLevel === 'MAXIMUM', 'Privacy level set to MAXIMUM');
    assert(ccipPayload.sourceChain === 'ethereum-sepolia', 'Source chain correct');

    console.log();

    // ─── TEST 2: SANCTIONS SCREENING ORACLE ─────────────────────
    console.log('─'.repeat(70));
    console.log('⚡ TEST 2: Sanctions Screening Oracle');
    console.log('─'.repeat(70));

    // 2a: Clean address
    const cleanResult = await screenWallet('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38');
    assert(cleanResult.success === true, 'Clean address screened successfully');
    assert(cleanResult.screening.riskLevel === 'LOW', 'Clean address rated LOW risk');
    assert(cleanResult.screening.isClear === true, 'Clean address marked clear');
    assert(cleanResult.screening.attestation.hash.startsWith('0x'), 'Attestation hash generated');

    // 2b: Sanctioned pattern (Tornado Cash prefix match)
    const sanctionedResult = await screenWallet('0x098b716b8aaf21512996dc57eb0615e2383e2f96');
    assert(sanctionedResult.success === true, 'Sanctioned address screened');
    assert(sanctionedResult.screening.riskLevel === 'HIGH', 'Sanctioned address rated HIGH');
    assert(sanctionedResult.screening.isSanctioned === true, 'Sanctioned flag set');
    assert(sanctionedResult.screening.flags.length > 0, 'Sanctions flags populated');

    // 2c: Invalid address format
    const invalidResult = await screenWallet('not-an-address');
    assert(invalidResult.success === false, 'Rejects invalid address format');

    // 2d: Deep scan
    const deepResult = await screenWallet('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38', { deepScan: true });
    assert(deepResult.success === true, 'Deep scan completed');
    assert(deepResult.screening.metadata.deepScanEnabled === true, 'Deep scan flag recorded');

    // 2e: Chainlink Functions source generation
    const fnSource = generateChainlinkFunctionSource('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38');
    assert(fnSource.includes('Functions.makeHttpRequest'), 'Functions source uses Chainlink APIs');
    assert(fnSource.includes('Functions.encodeUint256'), 'Functions source returns encoded result');

    console.log();

    // ─── TEST 3: AI COMPLIANCE CO-PILOT ─────────────────────────
    console.log('─'.repeat(70));
    console.log('🧠 TEST 3: AI Compliance Co-Pilot (Fallback Mode)');
    console.log('─'.repeat(70));

    // 3a: Low-risk transfer
    const lowRisk = await runComplianceReview({
        sourceChain: 'ethereum',
        destChain: 'base',
        sourceJurisdiction: 'US',
        destJurisdiction: 'US',
        amountUSD: 5000,
        assetType: 'USDC',
        entityType: 'institution',
        sanctionsResult: null
    });
    assert(lowRisk.success === true, 'Low-risk review completed');
    assert(lowRisk.review.action.decision === 'APPROVE', 'Low-risk transfer approved');
    assert(lowRisk.review.action.requiresHumanApproval === false, 'No human approval needed');

    // 3b: High-value cross-jurisdiction transfer
    const highValue = await runComplianceReview({
        sourceChain: 'ethereum',
        destChain: 'polygon',
        sourceJurisdiction: 'US',
        destJurisdiction: 'JP',
        amountUSD: 500000,
        assetType: 'RWA_BOND',
        entityType: 'institution',
        sanctionsResult: null
    });
    assert(highValue.success === true, 'High-value review completed');
    assert(highValue.review.action.requiresHumanApproval === true, 'Human approval required for high-value');
    assert(highValue.review.riskAssessment.flags.length > 0, 'Risk flags raised for cross-jurisdiction');

    // 3c: Unknown jurisdiction
    const unknownJuris = await runComplianceReview({
        sourceChain: 'ethereum',
        destChain: 'arbitrum',
        sourceJurisdiction: 'XX',
        destJurisdiction: 'YY',
        amountUSD: 100000,
        assetType: 'WETH',
        entityType: 'dao',
        sanctionsResult: null
    });
    assert(unknownJuris.success === true, 'Unknown jurisdiction review completed');
    assert(unknownJuris.review.riskAssessment.flags.some(f => f.includes('Unknown')), 'Unknown jurisdiction flagged');

    // 3d: Privacy coins in restricted jurisdiction
    const restrictedAsset = await runComplianceReview({
        sourceChain: 'ethereum',
        destChain: 'polygon',
        sourceJurisdiction: 'JP',
        destJurisdiction: 'US',
        amountUSD: 25000,
        assetType: 'privacy_coins',
        entityType: 'individual',
        sanctionsResult: null
    });
    assert(restrictedAsset.success === true, 'Restricted asset review completed');
    assert(
        restrictedAsset.review.riskAssessment.flags.some(f => f.includes('restricted')),
        'Restricted asset flagged in JP'
    );

    console.log();

    // ─── SUMMARY ────────────────────────────────────────────────
    console.log('═'.repeat(70));
    console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('═'.repeat(70));

    if (failed === 0) {
        console.log('🏆 ALL TESTS PASSED — Sentinel v2.0 is ready for the hackathon!');
    } else {
        console.log(`⚠️  ${failed} test(s) failed. Review output above.`);
    }

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('❌ CRITICAL TEST ERROR:', err);
    process.exit(1);
});
