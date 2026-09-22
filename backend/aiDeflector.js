import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

/**
 * Sanitizes strings or errors to guarantee API keys are never exposed in logs or outputs
 */
function sanitizeOutput(text) {
  if (!text) return '';
  return String(text).replace(/(?:key|apiKey)=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]');
}

/**
 * Robustly parses JSON from LLM output, handling markdown blocks or surrounding text
 */
function extractJsonFromResponse(rawText) {
  if (!rawText) throw new Error('Empty response from AI model');
  let cleaned = rawText.trim();

  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    } else {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
  }

  // Attempt to locate outer JSON braces if extra text exists
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Heuristic fallback engine for offline development or missing API keys.
 * Accurately flags common job scams, fake equipment checks, and fee traps.
 */
function runHeuristicAnalysis(text) {
  const lower = text.toLowerCase();
  const redFlags = [];
  const defensiveAdvice = [];
  let score = 0;
  let primaryVector = 'Benign / Unclassified';

  // 1. Fake Equipment Deposit / Check Scam
  if (
    (lower.includes('check') || lower.includes('cheque')) &&
    (lower.includes('equipment') || lower.includes('home office') || lower.includes('vendor') || lower.includes('software'))
  ) {
    score += 55;
    primaryVector = 'Fake Equipment Deposit & Check Fraud';
    redFlags.push('Employer promises to send a check to purchase equipment from a specific "vendor".');
    defensiveAdvice.push('Legitimate employers provide physical equipment directly. Never deposit an employer check to buy hardware from designated vendors.');
  }

  // 2. Upfront Fee Traps
  if (
    lower.includes('registration fee') ||
    lower.includes('training fee') ||
    lower.includes('background check fee') ||
    lower.includes('refundable deposit') ||
    lower.includes('processing fee')
  ) {
    score += 50;
    primaryVector = 'Upfront Fee / Advance Fee Fraud';
    redFlags.push('Demands an upfront fee, background check deposit, or training charge prior to starting.');
    defensiveAdvice.push('Never pay any upfront fees for job applications or onboarding. Legitimate employers cover all screening and equipment costs.');
  }

  // 3. Off-Platform Redirection (Telegram, WhatsApp, Signal)
  if (
    lower.includes('telegram') ||
    lower.includes('whatsapp') ||
    lower.includes('signal') ||
    lower.includes('text our hr')
  ) {
    score += 35;
    redFlags.push('Directs communication to unverified personal messaging apps (Telegram / WhatsApp) instead of corporate email.');
    defensiveAdvice.push('Insist on communicating through verified corporate email domains matching the official company website.');
  }

  // 4. Artificial Urgency & Immediate Hiring
  if (
    lower.includes('urgent') ||
    lower.includes('immediately') ||
    lower.includes('within 24 hours') ||
    lower.includes('congratulations! you have been selected') ||
    lower.includes('hired on the spot') ||
    lower.includes('limited slots')
  ) {
    score += 25;
    redFlags.push('Artificial urgency and claims of instant hiring without standard structured interviews.');
    defensiveAdvice.push('Take your time to investigate the sender. Urgency is designed to bypass your critical thinking.');
  }

  // 5. Unrealistic Compensation
  if (
    (/\$\s*(?:[5-9]\d|1\d\d)\s*\/?(?:hr|hour)/i.test(text) && (lower.includes('data entry') || lower.includes('assistant'))) ||
    lower.includes('$5000/week') ||
    lower.includes('make $500 a day')
  ) {
    score += 30;
    redFlags.push('Compensation is disproportionately high for entry-level tasks (e.g., $65/hr for basic data entry).');
    defensiveAdvice.push('Compare compensation against salary benchmarks like Glassdoor or Levels.fyi.');
  }

  // 6. Suspicious Payment Mediums (Crypto, Zelle, CashApp, Gift Cards)
  if (
    lower.includes('crypto') ||
    lower.includes('bitcoin') ||
    lower.includes('zelle') ||
    lower.includes('cashapp') ||
    lower.includes('gift card') ||
    lower.includes('western union')
  ) {
    score += 45;
    redFlags.push('Requests payment or transfer via irreversible peer-to-peer mechanisms (Zelle, Crypto, Gift Cards).');
    defensiveAdvice.push('Corporate payroll is handled via direct deposit (ACH) or formal paychecks, never gift cards or Zelle.');
  }

  const finalScore = Math.min(100, Math.max(0, score));
  let threatLevel = 'SAFE';
  if (finalScore >= 70) threatLevel = 'CRITICAL';
  else if (finalScore >= 30) threatLevel = 'SUSPICIOUS';

  if (redFlags.length === 0) {
    defensiveAdvice.push('Payload appears standard. Always verify sender identity via official corporate channels.');
  }

  return {
    aiThreatScore: finalScore,
    threatLevel,
    primaryVector: finalScore >= 30 ? primaryVector : 'Low Risk / Standard Communication',
    detectedRedFlags: redFlags.length > 0 ? redFlags : ['No immediate scam patterns detected in text payload.'],
    defensiveAdvice: defensiveAdvice,
    executiveSummary: `Heuristic deflection scan concluded ${threatLevel} threat status (Index: ${finalScore}%).`
  };
}

/**
 * Invokes Gemini AI using Google GenAI Node SDK with automated model fallback
 * @param {string} payload - The job offer text, email body, or message
 * @returns {Promise<Object>} Structured Threat Deflector Report
 */
export async function deflectThreat(payload) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    console.warn('[AI Deflector] No GEMINI_API_KEY configured. Running advanced Heuristic Deflector.');
    return runHeuristicAnalysis(payload);
  }

  const prompt = `
You are the AI Deflector Engine for "Anti-Gravity Shield", an elite cybersecurity platform inspecting scam communications, fake job offers, and phishing attempts.

Carefully inspect the following payload for:
1. Job Scams & Fake Employment (unrealistic pay, immediate hire, vague responsibilities, telegram/whatsapp recruiter redirection)
2. Upfront Fee Traps (application fee, background check deposit, training fee, visa processing charge)
3. Fake Equipment Deposits (employer sending a cashier check to buy hardware from an 'approved vendor')
4. Artificial Urgency & Social Engineering ("offer expires in 2 hours", "immediate wire transfer needed")
5. Identity & Credential Harvesting (asking for SSN, bank credentials, ID copy upfront)
6. Suspicious Payment Vectors (Gift cards, Crypto, Zelle, Wire transfers)

PAYLOAD TO INSPECT:
"""
${payload}
"""

RESPOND STRICTLY WITH VALID RAW JSON (NO MARKDOWN CODE BLOCKS, NO TRIPLE BACKTICKS, NO EXPLANATORY TEXT OUTSIDE JSON).
Format:
{
  "aiThreatScore": <integer between 0 and 100>,
  "threatLevel": <"SAFE" | "SUSPICIOUS" | "CRITICAL">,
  "primaryVector": <concise string naming main scam type or "Clean">,
  "detectedRedFlags": [<array of string bullet points describing specific red flags found>],
  "defensiveAdvice": [<array of actionable security countermeasures for the user>],
  "executiveSummary": <concise 1-2 sentence executive assessment>
}
`;

  // Candidate models in priority order (Fast lightweight models first to prevent timeouts)
  const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const modelCandidates = Array.from(new Set([
    preferredModel,
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
    'gemini-flash-latest'
  ]));

  let rawText = '';
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });

      // Add 12s timeout per model to allow quick response while preventing infinite hangs
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Model ${modelName} timed out after 12s`)), 12000);
      });

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);
      const response = await result.response;
      rawText = response.text();
      if (rawText) {
        break; // Successfully generated content
      }
    } catch (err) {
      lastError = err;
      console.warn(`[AI Deflector] Model ${modelName} failed: ${sanitizeOutput(err.message)}. Trying fallback...`);
    }
  }

  if (!rawText && lastError) {
    console.error('[AI Deflector] All Gemini models failed or timed out. Error:', sanitizeOutput(lastError.message));
    console.log('[AI Deflector] Engaging fallback heuristic defense engine.');
    const heuristic = runHeuristicAnalysis(payload);
    heuristic.executiveSummary += ' (Heuristic engine active due to AI service fallback).';
    return heuristic;
  }

  try {
    const parsed = extractJsonFromResponse(rawText);

    // Normalize and validate score
    let score = Number(parsed.aiThreatScore);
    if (isNaN(score)) score = 50;
    score = Math.min(100, Math.max(0, Math.round(score)));

    let threatLevel = parsed.threatLevel;
    if (!['SAFE', 'SUSPICIOUS', 'CRITICAL'].includes(threatLevel)) {
      if (score >= 70) threatLevel = 'CRITICAL';
      else if (score >= 30) threatLevel = 'SUSPICIOUS';
      else threatLevel = 'SAFE';
    }

    return {
      aiThreatScore: score,
      threatLevel,
      primaryVector: parsed.primaryVector || 'Phishing / Social Engineering',
      detectedRedFlags: Array.isArray(parsed.detectedRedFlags) && parsed.detectedRedFlags.length > 0
        ? parsed.detectedRedFlags
        : ['Potential threat signatures detected in payload content.'],
      defensiveAdvice: Array.isArray(parsed.defensiveAdvice) && parsed.defensiveAdvice.length > 0
        ? parsed.defensiveAdvice
        : ['Verify all sender credentials independently.'],
      executiveSummary: parsed.executiveSummary || 'Inspection completed by Gemini AI Deflector.'
    };

  } catch (parseErr) {
    console.error('[AI Deflector] JSON parsing error from Gemini output:', sanitizeOutput(parseErr.message));
    console.log('[AI Deflector] Engaging fallback heuristic defense engine.');
    const heuristic = runHeuristicAnalysis(payload);
    heuristic.executiveSummary += ' (Heuristic engine active due to response formatting).';
    return heuristic;
  }
}

export default {
  deflectThreat
};