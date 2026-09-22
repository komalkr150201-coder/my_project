import React, { useState, useMemo } from 'react';
import {
  Link as LinkIcon,
  Globe,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import soundFx from '../utils/AudioEngine';

const SAMPLE_URLS = [
  {
    title: 'Suspicious Bank Phish',
    url: 'http://update-secure-auth.bank-support.xyz/login?session=verify',
    risk: 'CRITICAL',
    type: 'Domain Spoof'
  },
  {
    title: 'Obfuscated Bitly Redirect',
    url: 'http://bit.ly/3xHR-verify-login?redirect=update-direct-deposit',
    risk: 'CRITICAL',
    type: 'URL Shortener'
  },
  {
    title: 'Telegram Recruiter Link',
    url: 'https://t.me/GlobalRecruiter_VIP_2026?start=deposit_check',
    risk: 'SUSPICIOUS',
    type: 'Off-Platform'
  },
  {
    title: 'Verified Corporate Portal',
    url: 'https://careers.acmecorp.com/portal/job-offer/engineer-4882',
    risk: 'SAFE',
    type: 'Authentic'
  }
];

export default function LinkInspector({ onAnalyzeUrl, isAnalyzing }) {
  const [urlInput, setUrlInput] = useState('http://update-secure-auth.bank-support.xyz/login?session=verify');
  const [copied, setCopied] = useState(false);

  // Parse and evaluate URL components
  const parsedData = useMemo(() => {
    if (!urlInput.trim()) return null;
    let raw = urlInput.trim();
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = 'https://' + raw;
    }

    try {
      const u = new URL(raw);
      const isHttps = u.protocol === 'https:';
      const hostname = u.hostname;
      const parts = hostname.split('.');
      const tld = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
      const subdomains = parts.slice(0, -2);
      const domainName = parts.slice(-2).join('.');

      const suspiciousTlds = ['xyz', 'top', 'live', 'click', 'zip', 'mov', 'loan', 'club', 'work', 'gq', 'tk', 'ml', 'cf'];
      const isRiskyTld = suspiciousTlds.includes(tld);
      const hasIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      const isShortener = ['bit.ly', 'tinyurl.com', 'is.gd', 'cutt.ly', 't.co'].includes(domainName.toLowerCase());
      const hasSensitiveKeywords = /login|verify|signin|banking|security|account|password|auth|wallet/i.test(u.pathname + u.search);

      let heuristicScore = 15;
      if (!isHttps) heuristicScore += 25;
      if (isRiskyTld) heuristicScore += 30;
      if (hasIpHost) heuristicScore += 45;
      if (isShortener) heuristicScore += 35;
      if (hasSensitiveKeywords) heuristicScore += 25;
      if (subdomains.length >= 2) heuristicScore += 15;

      const boundedScore = Math.min(100, heuristicScore);

      return {
        valid: true,
        protocol: u.protocol,
        isHttps,
        hostname,
        domainName,
        subdomains: subdomains.join('.'),
        tld,
        pathname: u.pathname,
        search: u.search,
        hash: u.hash,
        params: Array.from(u.searchParams.entries()),
        isRiskyTld,
        hasIpHost,
        isShortener,
        hasSensitiveKeywords,
        heuristicScore: boundedScore
      };
    } catch (e) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }, [urlInput]);

  const handleScanClick = () => {
    if (!urlInput.trim()) return;
    soundFx.playDeflectorEngage();
    onAnalyzeUrl(urlInput.trim());
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(urlInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="link-graviton-card animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.14)', border: '1px solid var(--card-border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--headline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Deep Link Graviton
              <span className="badge-pill" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', border: '1px solid var(--card-border-glow)' }}>
                Heuristic Scanner
              </span>
            </h3>
            <p className="text-muted" style={{ fontSize: '0.78rem' }}>
              Inspect suspicious URLs, subdomains, redirection hops & protocol certificates.
            </p>
          </div>
        </div>
      </div>

      {/* URL Input Bar */}
      <div style={{ marginTop: '1.5rem' }}>
        <div className="url-input-container">
          <div className="url-input-icon">
            <LinkIcon className="w-4 h-4 text-cyan" />
          </div>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter suspicious link (e.g. https://domain-verify.xyz/login)..."
            className="url-input-field font-mono"
            style={{ fontSize: '0.85rem' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="url-action-btn"
                title="Clear input"
              >
                <XCircle className="w-4 h-4 text-muted hover:text-danger" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="url-action-btn"
              title="Copy URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald" /> : <Copy className="w-4 h-4 text-muted" />}
            </button>
          </div>
        </div>

        {/* Preset URL Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '0.85rem' }}>
          <span className="metric-label" style={{ marginRight: '4px' }}>Quick Presets:</span>
          {SAMPLE_URLS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrlInput(sample.url);
                soundFx.playClick();
              }}
              className="preset-chip"
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: sample.risk === 'CRITICAL' ? 'var(--accent-rose)' : sample.risk === 'SUSPICIOUS' ? 'var(--accent-amber)' : 'var(--accent-emerald)'
              }} />
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Anatomical Breakdown */}
      {parsedData && parsedData.valid && (
        <div className="url-breakdown-grid" style={{ marginTop: '1.5rem' }}>
          {/* Protocol & SSL */}
          <div className="url-metric-tile">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="metric-label">Protocol Security</span>
              {parsedData.isHttps ? (
                <span className="metric-status-safe" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                  <Lock className="w-3.5 h-3.5" /> TLS Secured
                </span>
              ) : (
                <span className="metric-status-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                  <Unlock className="w-3.5 h-3.5" /> Insecure HTTP
                </span>
              )}
            </div>
            <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--headline)', marginTop: '0.35rem' }}>
              {parsedData.protocol}
            </div>
            <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>
              {parsedData.isHttps ? 'Traffic is encrypted' : 'Cleartext transmission vulnerable to interception'}
            </p>
          </div>

          {/* Root Domain & TLD */}
          <div className="url-metric-tile">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="metric-label">Target Domain</span>
              {parsedData.isRiskyTld ? (
                <span className="metric-status-danger" style={{ fontSize: '0.75rem' }}>High-Risk TLD</span>
              ) : (
                <span className="metric-status-safe" style={{ fontSize: '0.75rem' }}>Standard TLD</span>
              )}
            </div>
            <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--headline)', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {parsedData.domainName}
            </div>
            <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>
              TLD: <span className="font-mono text-cyan">.{parsedData.tld}</span> {parsedData.isRiskyTld && '• frequently used in fraud'}
            </p>
          </div>

          {/* Subdomain Camouflage */}
          <div className="url-metric-tile">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="metric-label">Subdomain Masking</span>
              {parsedData.subdomains ? (
                <span className="metric-status-warn" style={{ fontSize: '0.75rem' }}>Masked</span>
              ) : (
                <span className="metric-status-safe" style={{ fontSize: '0.75rem' }}>Direct</span>
              )}
            </div>
            <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--headline)', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {parsedData.subdomains || '(None)'}
            </div>
            <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>
              {parsedData.subdomains ? 'Multi-tier subdomains may simulate authentic brands' : 'Standard single host'}
            </p>
          </div>

          {/* Path & Query Tokens */}
          <div className="url-metric-tile">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="metric-label">Heuristic Risk Score</span>
              <span className={`font-mono ${
                parsedData.heuristicScore >= 70 ? 'text-danger' :
                parsedData.heuristicScore >= 35 ? 'text-amber' :
                'text-emerald'
              }`} style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                {parsedData.heuristicScore}%
              </span>
            </div>
            <div className="risk-mini-bar" style={{ margin: '0.5rem 0' }}>
              <div
                className="risk-mini-fill"
                style={{
                  width: `${parsedData.heuristicScore}%`,
                  background: parsedData.heuristicScore >= 70 ? 'var(--accent-rose)' : parsedData.heuristicScore >= 35 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                }}
              />
            </div>
            <p className="text-muted" style={{ fontSize: '0.72rem' }}>
              {parsedData.hasSensitiveKeywords ? '⚠️ Credential harvesting keywords detected' : 'Standard route structure'}
            </p>
          </div>
        </div>
      )}

      {/* Query Parameters Section */}
      {parsedData && parsedData.valid && parsedData.params.length > 0 && (
        <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '18px', background: 'var(--surface-inset)', border: '1px solid var(--card-border)', fontSize: '0.78rem' }}>
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
            <Search className="w-3.5 h-3.5 text-cyan" />
            Detected Query Parameters ({parsedData.params.length})
          </div>
          <div className="stack-gap-2">
            {parsedData.params.map(([key, val], idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '10px', background: 'var(--surface-card)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem' }}>
                <span className="text-cyan" style={{ fontWeight: 600 }}>{key}</span>
                <span className="text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleScanClick}
          disabled={isAnalyzing || !urlInput.trim()}
          className="btn-deflector"
          style={{ width: '100%', maxWidth: '340px' }}
        >
          {isAnalyzing ? (
            <>
              <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span>Inspecting Link Core...</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <span>Engage Link Deflector Core</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
