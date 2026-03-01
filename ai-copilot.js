/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🧠 AI COMPLIANCE CO-PILOT — DeepSeek via Chainlink Functions + CRE
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Turns the existing DeepSeek/Vertex AI bridge into a Chainlink-native
 * compliance reasoning engine:
 * 
 *   1. High-value CCIP transfer arrives (>$50K threshold)
 *   2. Sentinel triggers Chainlink Function → calls DeepSeek
 *   3. AI analyzes: jurisdiction rules, entity risk, transaction patterns
 *   4. Returns structured risk score + recommendation
 *   5. Sentinel auto-approves (LOW) or escalates (MEDIUM/HIGH)
 * 
 * Convergence Hackathon Theme: "AI agents consuming CRE workflows"
 * 
 * @module ai-copilot
 * @author Sentinel Architect
 */

import http from 'http';
import crypto from 'crypto';

// ─── CONFIGURATION ───────────────────────────────────────────────

const VERTEX_BRIDGE_URL = 'http://localhost:3005/v1/chat/completions';
const HIGH_VALUE_THRESHOLD_USD = 50000;
const MODEL = 'deepseek-chat';

// Jurisdiction-specific regulatory rules (embedded knowledge)
const JURISDICTION_RULES = {
    'US': {
        name: 'United States',
        regulator: 'SEC / FinCEN',
        reportingThreshold: 10000,
        requiresSAR: true,
        requiresCTR: true,  // Currency Transaction Report
        restrictedAssets: ['privacy_coins', 'unregistered_securities'],
        notes: 'BSA/AML compliance required. SAR filing for suspicious activity >$5K.'
    },
    'EU': {
        name: 'European Union',
        regulator: 'ESMA / EBA',
        reportingThreshold: 15000,
        requiresSAR: true,
        requiresCTR: false,
        restrictedAssets: ['unregistered_securities'],
        notes: 'MiCA regulation. Travel Rule applies to all transfers >€1,000.'
    },
    'SG': {
        name: 'Singapore',
        regulator: 'MAS',
        reportingThreshold: 20000,
        requiresSAR: true,
        requiresCTR: false,
        restrictedAssets: [],
        notes: 'Payment Services Act. Licensed DPT service providers only.'
    },
    'UK': {
        name: 'United Kingdom',
        regulator: 'FCA',
        reportingThreshold: 10000,
        requiresSAR: true,
        requiresCTR: false,
        restrictedAssets: ['derivatives_for_retail'],
        notes: 'FCA crypto registration required. MLR 2017 compliance.'
    },
    'JP': {
        name: 'Japan',
        regulator: 'FSA / JFSA',
        reportingThreshold: 2000000,  // JPY
        requiresSAR: true,
        requiresCTR: false,
        restrictedAssets: ['privacy_coins'],
        notes: 'FIEA compliance. Only registered exchanges. Privacy coins banned.'
    }
};

// ─── CORE AI COMPLIANCE ENGINE ──────────────────────────────────

/**
 * Run an AI compliance review on a cross-chain transfer.
 * Uses DeepSeek (via Vertex bridge) to analyze the transaction context.
 * 
 * @param {object} transferContext - Full transfer details
 * @param {string} transferContext.sourceChain - Source chain name
 * @param {string} transferContext.destChain - Destination chain name
 * @param {string} transferContext.sourceJurisdiction - 2-letter country code
 * @param {string} transferContext.destJurisdiction - 2-letter country code
 * @param {number} transferContext.amountUSD - Transfer amount in USD
 * @param {string} transferContext.assetType - Type of asset being transferred
 * @param {string} transferContext.entityType - 'individual' | 'institution' | 'dao'
 * @param {object} transferContext.sanctionsResult - Result from sanctions-oracle
 * @returns {object} AI compliance assessment
 */
export async function runComplianceReview(transferContext) {
    const startTime = Date.now();

    // Step 1: Gather jurisdiction rules
    const sourceRules = JURISDICTION_RULES[transferContext.sourceJurisdiction] || null;
    const destRules = JURISDICTION_RULES[transferContext.destJurisdiction] || null;

    // Step 2: Build the AI prompt with full regulatory context
    const prompt = buildCompliancePrompt(transferContext, sourceRules, destRules);

    // Step 3: Call DeepSeek via Vertex Bridge
    let aiAnalysis;
    try {
        aiAnalysis = await callDeepSeek(prompt);
    } catch (error) {
        // Fallback: use rule-based analysis if AI is unavailable
        aiAnalysis = runFallbackAnalysis(transferContext, sourceRules, destRules);
    }

    // Step 4: Parse AI response into structured risk assessment
    const riskAssessment = parseAIResponse(aiAnalysis, transferContext);

    // Step 5: Determine action
    const action = determineAction(riskAssessment, transferContext.amountUSD);

    const elapsed = Date.now() - startTime;

    return {
        success: true,
        review: {
            transferSummary: {
                route: `${transferContext.sourceChain} → ${transferContext.destChain}`,
                jurisdictions: `${transferContext.sourceJurisdiction} → ${transferContext.destJurisdiction}`,
                amount: `$${transferContext.amountUSD.toLocaleString()} USD`,
                asset: transferContext.assetType,
                entity: transferContext.entityType
            },
            riskAssessment: {
                overallRisk: riskAssessment.riskLevel,
                confidenceScore: riskAssessment.confidence,
                riskScore: riskAssessment.score,
                flags: riskAssessment.flags,
                regulatoryNotes: riskAssessment.regulatoryNotes
            },
            action: {
                decision: action.decision,
                reason: action.reason,
                requiresHumanApproval: action.requiresHuman,
                escalationLevel: action.escalationLevel
            },
            aiAnalysis: {
                model: MODEL,
                provider: 'DeepSeek via Chainlink Functions',
                analysisText: aiAnalysis.summary || aiAnalysis,
                processingTimeMs: elapsed
            },
            metadata: {
                timestamp: new Date().toISOString(),
                reviewId: crypto.randomBytes(8).toString('hex'),
                sentinelVersion: '2.0.0',
                chainlinkProduct: 'CRE + Functions'
            }
        }
    };
}

/**
 * Generate Chainlink Functions source for AI compliance review.
 * This JavaScript runs on the Chainlink DON.
 */
export function generateAICopilotFunctionSource() {
    return `
// ═══════════════════════════════════════════════════════════════
// Chainlink Functions Source: AI Compliance Co-Pilot
// Calls DeepSeek AI for regulatory analysis on cross-chain transfers
// ═══════════════════════════════════════════════════════════════

const sourceJurisdiction = args[0];
const destJurisdiction = args[1];
const amountUSD = parseInt(args[2]);
const assetType = args[3];

// Call DeepSeek via the Vertex bridge
const aiResponse = await Functions.makeHttpRequest({
    url: secrets.VERTEX_BRIDGE_URL + "/v1/chat/completions",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: {
        model: "deepseek-chat",
        messages: [{
            role: "system",
            content: "You are an institutional compliance analyst. Return ONLY a JSON object with: risk (LOW/MEDIUM/HIGH), confidence (0-1), flags (array of strings)."
        }, {
            role: "user",
            content: "Analyze cross-chain transfer: " + amountUSD + " USD of " + assetType + " from " + sourceJurisdiction + " to " + destJurisdiction + ". Assess regulatory risk."
        }],
        max_tokens: 200,
        temperature: 0.1
    }
});

const analysis = JSON.parse(aiResponse.data.choices[0].message.content);
const riskCode = analysis.risk === "LOW" ? 1 : analysis.risk === "MEDIUM" ? 2 : 3;

return Functions.encodeUint256(riskCode);
`;
}

// ─── INTERNAL HELPERS ────────────────────────────────────────────

/**
 * Build the regulatory context prompt for DeepSeek
 */
function buildCompliancePrompt(ctx, sourceRules, destRules) {
    const sourceInfo = sourceRules
        ? `Source jurisdiction: ${sourceRules.name} (${sourceRules.regulator}). Reporting threshold: $${sourceRules.reportingThreshold}. Notes: ${sourceRules.notes}`
        : `Source jurisdiction: ${ctx.sourceJurisdiction} (unknown regulatory framework)`;

    const destInfo = destRules
        ? `Destination jurisdiction: ${destRules.name} (${destRules.regulator}). Reporting threshold: $${destRules.reportingThreshold}. Notes: ${destRules.notes}`
        : `Destination jurisdiction: ${ctx.destJurisdiction} (unknown regulatory framework)`;

    const isHighValue = ctx.amountUSD >= HIGH_VALUE_THRESHOLD_USD;

    return {
        system: `You are a Senior Institutional Compliance Analyst specializing in cross-chain digital asset regulation. You analyze cross-border token transfers for regulatory risk. Always respond with ONLY a valid JSON object containing: risk (LOW/MEDIUM/HIGH), confidence (0.0-1.0), flags (array of risk flag strings), summary (one-sentence analysis), regulatoryNotes (array of applicable regulations).`,
        user: `ANALYZE THIS CROSS-CHAIN TRANSFER:
- Route: ${ctx.sourceChain} → ${ctx.destChain}
- Amount: $${ctx.amountUSD.toLocaleString()} USD
- Asset: ${ctx.assetType}
- Entity Type: ${ctx.entityType}
- ${sourceInfo}
- ${destInfo}
- High-value flag: ${isHighValue ? 'YES (>$50K threshold)' : 'No'}
- Sanctions screening: ${ctx.sanctionsResult ? ctx.sanctionsResult.riskLevel : 'NOT_SCREENED'}

Assess the regulatory compliance risk and provide your structured analysis.`
    };
}

/**
 * Call DeepSeek through the Vertex bridge
 */
async function callDeepSeek(prompt) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: prompt.system },
                { role: 'user', content: prompt.user }
            ],
            max_tokens: 300,
            temperature: 0.1  // Low temp for deterministic compliance analysis
        });

        const url = new URL(VERTEX_BRIDGE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            },
            timeout: 15000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.message?.content || '';
                    // Try to parse the AI response as JSON
                    try {
                        resolve(JSON.parse(content));
                    } catch {
                        resolve({ summary: content, risk: 'MEDIUM', confidence: 0.5, flags: ['AI response not structured'] });
                    }
                } catch {
                    reject(new Error('Failed to parse Vertex bridge response'));
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('DeepSeek request timed out (15s)'));
        });

        req.write(body);
        req.end();
    });
}

/**
 * Fallback rule-based analysis when AI is unavailable
 */
function runFallbackAnalysis(ctx, sourceRules, destRules) {
    const flags = [];
    let riskScore = 0;

    // High value check
    if (ctx.amountUSD >= HIGH_VALUE_THRESHOLD_USD) {
        riskScore += 0.2;
        flags.push('High-value transfer exceeds $50K threshold');
    }

    // Cross-jurisdiction check
    if (ctx.sourceJurisdiction !== ctx.destJurisdiction) {
        riskScore += 0.1;
        flags.push('Cross-jurisdiction transfer requires dual compliance');
    }

    // Unknown jurisdiction check
    if (!sourceRules) {
        riskScore += 0.25;
        flags.push(`Unknown source jurisdiction: ${ctx.sourceJurisdiction}`);
    }
    if (!destRules) {
        riskScore += 0.25;
        flags.push(`Unknown destination jurisdiction: ${ctx.destJurisdiction}`);
    }

    // Restricted asset check
    if (sourceRules?.restrictedAssets?.includes(ctx.assetType)) {
        riskScore += 0.35;
        flags.push(`Asset type "${ctx.assetType}" is restricted in ${ctx.sourceJurisdiction}`);
    }
    if (destRules?.restrictedAssets?.includes(ctx.assetType)) {
        riskScore += 0.35;
        flags.push(`Asset type "${ctx.assetType}" is restricted in ${ctx.destJurisdiction}`);
    }

    // Entity type check
    if (ctx.entityType === 'dao') {
        riskScore += 0.15;
        flags.push('DAO entities face uncertain regulatory classification');
    }

    // Sanctions pre-check
    if (ctx.sanctionsResult?.riskLevel === 'HIGH') {
        riskScore += 0.5;
        flags.push('Sanctions screening flagged HIGH risk');
    }

    const level = riskScore < 0.3 ? 'LOW' : riskScore < 0.65 ? 'MEDIUM' : 'HIGH';

    return {
        risk: level,
        confidence: 0.75,
        score: Math.round(riskScore * 100) / 100,
        flags,
        summary: `Fallback rule-based analysis: ${level} risk (score: ${riskScore.toFixed(2)}). ${flags.length} flag(s) raised.`,
        regulatoryNotes: [
            sourceRules?.notes || `No regulatory data for ${ctx.sourceJurisdiction}`,
            destRules?.notes || `No regulatory data for ${ctx.destJurisdiction}`
        ],
        source: 'FALLBACK_RULES'
    };
}

/**
 * Parse AI response into standardized risk assessment
 */
function parseAIResponse(aiResponse, ctx) {
    return {
        riskLevel: aiResponse.risk || 'MEDIUM',
        confidence: aiResponse.confidence || 0.5,
        score: aiResponse.score || (aiResponse.risk === 'LOW' ? 0.15 : aiResponse.risk === 'HIGH' ? 0.85 : 0.45),
        flags: aiResponse.flags || [],
        regulatoryNotes: aiResponse.regulatoryNotes || [],
        summary: aiResponse.summary || 'Analysis complete.',
        source: aiResponse.source || 'DEEPSEEK_AI'
    };
}

/**
 * Determine final action based on risk assessment
 */
function determineAction(assessment, amountUSD) {
    const isHighValue = amountUSD >= HIGH_VALUE_THRESHOLD_USD;

    if (assessment.riskLevel === 'HIGH') {
        return {
            decision: 'REJECT',
            reason: `High-risk transfer blocked. Flags: ${assessment.flags.join('; ')}`,
            requiresHuman: true,
            escalationLevel: 'CRITICAL'
        };
    }

    if (assessment.riskLevel === 'MEDIUM' || (isHighValue && assessment.confidence < 0.8)) {
        return {
            decision: 'ESCALATE',
            reason: `Medium risk or low-confidence high-value transfer requires human review.`,
            requiresHuman: true,
            escalationLevel: 'ELEVATED'
        };
    }

    return {
        decision: 'APPROVE',
        reason: `Low-risk transfer auto-approved. Confidence: ${assessment.confidence}.`,
        requiresHuman: false,
        escalationLevel: 'ROUTINE'
    };
}
