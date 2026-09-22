/**
 * Link Graviton - Advanced URL Risk Metric Engine
 * Evaluates transport protocols, domain shorteners, suspicious TLDs,
 * obfuscation patterns, typosquatting vectors, and payload length.
 */

// Well-known URL shorteners used to conceal destination domains
const KNOWN_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'adf.ly',
  'bit.do',
  'cutt.ly',
  'rb.gy',
  'shorturl.at',
  'rebrand.ly',
  's.id',
  'v.gd',
  'clck.ru'
]);

// Suspicious / high-abuse TLDs commonly leveraged in phishing campaigns
const SUSPICIOUS_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq', // Free dot-TK registry variants
  'xyz', 'top', 'work', 'click', 'buzz', 'club', 'country',
  'kim', 'surf', 'stream', 'zip', 'mov', 'rest', 'fit', 'gdn',
  'racing', 'review', 'download', 'party', 'trade', 'accountant'
]);

// High-risk brand keywords & credential phishing tokens
const PHISHING_KEYWORDS = [
  'verify', 'account-update', 'login', 'signin', 'secure-bank',
  'authenticate', 'billing', 'password-reset', 'wallet', 'crypto',
  'metamask', 'binance-support', 'appleid', 'microsoft-online',
  'telegram', 'whatsapp', 'wa.me', 'claim-reward', 'payroll',
  'direct-deposit', 'hr-portal', 'tax-refund', 'urgent-action'
];

// Regex to extract all URLs (http, https, and bare domains with paths)
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(?:com|org|net|xyz|top|work|io|co|tk|click|info)[^\s]*)/gi;
const IPV4_REGEX = /^(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[\/?#]|$)/i;

/**
 * Parses and evaluates risk for a single URL string
 * @param {string} rawUrl 
 * @returns {Object} URL Risk Metric Report
 */
export function evaluateSingleUrl(rawUrl) {
  let normalizedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'http://' + normalizedUrl;
  }

  let parsed = null;
  try {
    parsed = new URL(normalizedUrl);
  } catch (err) {
    return {
      url: rawUrl,
      isValid: false,
      riskScore: 60,
      flags: ['Malformed URL structure detected (RFC parsing failed)'],
      metrics: { malformed: true }
    };
  }

  let riskScore = 0;
  const flags = [];
  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();
  const fullHref = parsed.href;

  // 1. Insecure Protocol Check
  if (protocol === 'http:') {
    riskScore += 30;
    flags.push('Insecure Transport: Plain HTTP protocol detected without SSL/TLS encryption.');
  }

  // 2. Direct IP Address Hostname
  if (IPV4_REGEX.test(normalizedUrl) || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    riskScore += 45;
    flags.push('Raw IP Hostname: Host uses an unmapped numeric IP address, a classic phishing indicator.');
  }

  // 3. Domain Shortener Masking
  if (KNOWN_SHORTENERS.has(hostname) || Array.from(KNOWN_SHORTENERS).some(s => hostname.endsWith('.' + s))) {
    riskScore += 35;
    flags.push(`URL Masking Detected: Host "${hostname}" is a known shortener obscuring actual endpoint.`);
  }

  // 4. Suspicious TLD Inspection
  const domainParts = hostname.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (SUSPICIOUS_TLDS.has(tld)) {
    riskScore += 35;
    flags.push(`High-Risk TLD: ".${tld}" has a statistically high correlation with disposable scam domains.`);
  }

  // 5. Excessive URL Length and Query Obfuscation
  if (fullHref.length > 120) {
    riskScore += 20;
    flags.push(`Excessive URL Length (${fullHref.length} characters) typical of tracking or token masking.`);
  } else if (fullHref.length > 75) {
    riskScore += 10;
  }

  // 6. Embedded Auth Phishing Trick (@ sign in URL authority)
  if (rawUrl.includes('@')) {
    riskScore += 40;
    flags.push('Credential Phishing Vector: Contains "@" symbol intended to spoof legitimate domain prefix.');
  }

  // 7. Punycode / IDN Homograph Attack (xn--)
  if (hostname.includes('xn--')) {
    riskScore += 35;
    flags.push('IDN Homograph Vector: Punycode (xn--) detected; possible international character spoofing.');
  }

  // 8. Suspicious Phishing Keywords in Path or Subdomains
  const lowerPath = (parsed.pathname + parsed.search).toLowerCase();
  const matchedKeywords = PHISHING_KEYWORDS.filter(kw => hostname.includes(kw) || lowerPath.includes(kw));
  if (matchedKeywords.length > 0) {
    riskScore += Math.min(30, matchedKeywords.length * 15);
    flags.push(`Deceptive Keywords Found: [${matchedKeywords.join(', ')}] targeted at credential harvesting.`);
  }

  // 9. Excessive Subdomain Depth (e.g. login.microsoft.security.verify.evil.com)
  if (domainParts.length >= 4) {
    riskScore += 20;
    flags.push(`Deep Subdomain Stacking: Domain has ${domainParts.length} levels, frequently used to disguise origin.`);
  }

  // Bound score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, riskScore));

  return {
    url: rawUrl,
    normalizedUrl: fullHref,
    isValid: true,
    hostname,
    protocol,
    tld,
    riskScore: finalScore,
    flags,
    metrics: {
      isHttps: protocol === 'https:',
      isIpHost: IPV4_REGEX.test(normalizedUrl),
      isShortener: KNOWN_SHORTENERS.has(hostname),
      isSuspiciousTld: SUSPICIOUS_TLDS.has(tld),
      hasPhishingKeywords: matchedKeywords.length > 0,
      charLength: fullHref.length
    }
  };
}

/**
 * Extracts and assesses all links in any text or single URL
 * @param {string} payload 
 * @returns {Object} Link Graviton Consolidated Report
 */
export function evaluateLinks(payload) {
  if (typeof payload !== 'string' || !payload.trim()) {
    return {
      hasLinks: false,
      urlCount: 0,
      linkScore: 0,
      flags: [],
      urlsDetected: []
    };
  }

  const rawMatches = payload.match(URL_REGEX) || [];
  const uniqueUrls = Array.from(new Set(rawMatches.map(u => u.trim())));

  if (uniqueUrls.length === 0) {
    return {
      hasLinks: false,
      urlCount: 0,
      linkScore: 0,
      flags: [],
      urlsDetected: []
    };
  }

  const evaluatedUrls = uniqueUrls.map(url => evaluateSingleUrl(url));

  // Determine highest single risk score and aggregate flags
  const highestScore = Math.max(...evaluatedUrls.map(u => u.riskScore));
  const allFlags = [];
  evaluatedUrls.forEach((item) => {
    item.flags.forEach((flag) => {
      if (!allFlags.includes(flag)) {
        allFlags.push(`[${item.hostname || 'Link'}] ${flag}`);
      }
    });
  });

  return {
    hasLinks: true,
    urlCount: evaluatedUrls.length,
    linkScore: highestScore,
    flags: allFlags,
    urlsDetected: evaluatedUrls
  };
}

export default {
  evaluateSingleUrl,
  evaluateLinks
};
