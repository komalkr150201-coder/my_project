import { deflectThreat } from './aiDeflector.js';
import { evaluateLinks } from './linkGraviton.js';

/**
 * Checks if the payload is solely a single URL
 * @param {string} text 
 */
function isStrictUrl(text) {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return !trimmed.includes(' ') && (url.protocol === 'http:' || url.protocol === 'https:');
  } catch (_) {
    return false;
  }
}

/**
 * Combines AI Deflector and Link Graviton into unified Scam Threat Index (0–100%)
 * @param {string} payload 
 * @returns {Promise<Object>} Unified Anti-Gravity Shield Inspection Report
 */
export async function inspectGravityShield(payload) {
  if (!payload || typeof payload !== 'string' || payload.trim().length === 0) {
    throw new Error('Payload cannot be empty. Provide email body, job posting, or URL to inspect.');
  }

  const cleanPayload = payload.trim();
  const isPureUrl = isStrictUrl(cleanPayload);
  const payloadType = isPureUrl ? 'url' : 'text';

  // Concurrently run Link Graviton and AI Deflector
  const [linkMetrics, aiReport] = await Promise.all([
    evaluateLinks(cleanPayload),
    deflectThreat(cleanPayload)
  ]);

  const aiScore = aiReport.aiThreatScore || 0;
  const linkScore = linkMetrics.linkScore || 0;

  // Multi-Vector Dynamic Weighting Algorithm
  let calculatedIndex = 0;

  if (isPureUrl) {
    // Pure URL: Link Graviton takes primary priority (60%), AI takes secondary (40%)
    calculatedIndex = (linkScore * 0.60) + (aiScore * 0.40);
  } else if (linkMetrics.hasLinks) {
    // Mixed text & links: AI context takes primary (65%), Link heuristics secondary (35%)
    calculatedIndex = (aiScore * 0.65) + (linkScore * 0.35);

    // Synergy threat boost: if both engines independently flag suspicious markers
    if (aiScore >= 45 && linkScore >= 45) {
      calculatedIndex += 10;
    }
  } else {
    // Pure text: 100% AI Deflector
    calculatedIndex = aiScore;
  }

  // Force bounds to 0–100 integer
  const finalThreatIndex = Math.min(100, Math.max(0, Math.round(calculatedIndex)));

  // Determine Unified Threat Tier
  let threatLevel = 'SAFE';
  if (finalThreatIndex >= 70) {
    threatLevel = 'CRITICAL';
  } else if (finalThreatIndex >= 30) {
    threatLevel = 'SUSPICIOUS';
  }

  // Unified Red Flags aggregation
  const consolidatedFlags = [];
  
  // Add Link Graviton flags
  if (linkMetrics.flags && linkMetrics.flags.length > 0) {
    consolidatedFlags.push(...linkMetrics.flags);
  }

  // Add AI Deflector flags
  if (aiReport.detectedRedFlags && aiReport.detectedRedFlags.length > 0) {
    aiReport.detectedRedFlags.forEach((flag) => {
      if (!consolidatedFlags.includes(flag)) {
        consolidatedFlags.push(flag);
      }
    });
  }

  if (consolidatedFlags.length === 0) {
    consolidatedFlags.push('Zero malicious indicators found. Communication conforms to standard patterns.');
  }

  // Unified Defensive Advice aggregation
  const consolidatedAdvice = [];
  if (aiReport.defensiveAdvice && aiReport.defensiveAdvice.length > 0) {
    consolidatedAdvice.push(...aiReport.defensiveAdvice);
  }

  if (linkMetrics.hasLinks && linkMetrics.linkScore >= 30) {
    consolidatedAdvice.push('Do not enter passwords, credit cards, or 2FA codes on the linked domain.');
    consolidatedAdvice.push('Inspect domain ownership on whois.domaintools.com or ICANN lookup before proceeding.');
  }

  if (consolidatedAdvice.length === 0) {
    consolidatedAdvice.push('Maintain general cybersecurity hygiene when interacting with unknown senders.');
  }

  // Determine Primary Vector
  let primaryVector = aiReport.primaryVector;
  if (isPureUrl && linkScore > aiScore) {
    primaryVector = 'Deceptive Link / Domain Spoofing';
  }

  // Calculate shield force-field metrics
  const fieldIntegrity = 100 - finalThreatIndex;
  const deflectorPower = finalThreatIndex >= 70 ? 'MAXIMUM DIVERSION' : finalThreatIndex >= 30 ? 'ELEVATED DEFLECTION' : 'PASSIVE MONITORING';

  return {
    threatIndex: finalThreatIndex,
    threatLevel,
    payloadType,
    primaryVector,
    executiveSummary: aiReport.executiveSummary,
    shieldStatus: {
      fieldIntegrity,
      deflectorPower,
      isShieldCompromised: finalThreatIndex >= 70
    },
    aiMetrics: {
      score: aiScore,
      vector: aiReport.primaryVector
    },
    linkMetrics: {
      hasLinks: linkMetrics.hasLinks,
      score: linkScore,
      urlCount: linkMetrics.urlCount,
      detectedUrls: linkMetrics.urlsDetected
    },
    redFlags: consolidatedFlags,
    defensiveAdvice: consolidatedAdvice
  };
}

export default {
  inspectGravityShield
};
