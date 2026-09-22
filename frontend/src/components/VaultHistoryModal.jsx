import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Trash2,
  Download,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import soundFx from '../utils/AudioEngine';

export default function VaultHistoryModal({
  vaultItems,
  onPurge,
  onSelectPayload,
  onRefresh,
  loading
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'SUSPICIOUS' | 'SAFE'
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Filter vault items
  const filteredItems = useMemo(() => {
    return vaultItems.filter((item) => {
      const matchesSearch = !searchQuery.trim() || 
        (item.payloadSnippet && item.payloadSnippet.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.payloadType && item.payloadType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.primaryVector && item.primaryVector.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTier = filterTier === 'ALL' || item.threatLevel === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [vaultItems, searchQuery, filterTier]);

  const counts = useMemo(() => {
    return {
      all: vaultItems.length,
      critical: vaultItems.filter(i => i.threatLevel === 'CRITICAL').length,
      suspicious: vaultItems.filter(i => i.threatLevel === 'SUSPICIOUS').length,
      safe: vaultItems.filter(i => i.threatLevel === 'SAFE').length,
    };
  }, [vaultItems]);

  const handleExportJson = () => {
    soundFx.playClick();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vaultItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `graviguard-vault-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopySnippet = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="vault-matrix-card animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.14)', border: '1px solid var(--card-border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--headline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Deflector Threat Vault
              <span className="badge-pill" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', border: '1px solid var(--card-border-glow)' }}>
                SQLite Core
              </span>
            </h3>
            <p className="text-muted" style={{ fontSize: '0.78rem' }}>
              Persistent audit log of all intercepted, neutralized & analyzed communications.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onRefresh}
            className="btn-gravi-secondary"
            title="Refresh Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={vaultItems.length === 0}
            className="btn-gravi-secondary"
            title="Export Vault as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          {vaultItems.length > 0 && (
            <button
              type="button"
              onClick={onPurge}
              className="btn-gravi-secondary"
              style={{ borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)' }}
              title="Purge Vault History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem' }}>
        {/* Search Box */}
        <div className="vault-search-box" style={{ flex: '1', minWidth: '240px', maxWidth: '360px' }}>
          <Search className="w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threat logs by keyword..."
            className="vault-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            type="button"
            onClick={() => { setFilterTier('ALL'); soundFx.playClick(); }}
            className={`vault-filter-pill ${filterTier === 'ALL' ? 'active' : ''}`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => { setFilterTier('CRITICAL'); soundFx.playClick(); }}
            className={`vault-filter-pill ${filterTier === 'CRITICAL' ? 'active-critical' : ''}`}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-rose)', marginRight: '4px' }} />
            Critical ({counts.critical})
          </button>
          <button
            type="button"
            onClick={() => { setFilterTier('SUSPICIOUS'); soundFx.playClick(); }}
            className={`vault-filter-pill ${filterTier === 'SUSPICIOUS' ? 'active-suspicious' : ''}`}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-amber)', marginRight: '4px' }} />
            Suspicious ({counts.suspicious})
          </button>
          <button
            type="button"
            onClick={() => { setFilterTier('SAFE'); soundFx.playClick(); }}
            className={`vault-filter-pill ${filterTier === 'SAFE' ? 'active-safe' : ''}`}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', marginRight: '4px' }} />
            Safe ({counts.safe})
          </button>
        </div>
      </div>

      {/* Record List */}
      <div style={{ marginTop: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <RefreshCw className="w-6 h-6 animate-spin text-cyan" />
            <span>Accessing encrypted SQLite vault...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '3rem 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <Database className="w-8 h-8 text-muted" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p className="font-display" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--headline)' }}>No matching deflection records</p>
            <p style={{ marginTop: '0.25rem' }}>
              {searchQuery ? 'Try clearing your search query.' : 'Run your first scan to register records in the Vault.'}
            </p>
          </div>
        ) : (
          <div className="stack-gap-2" style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              const isCritical = item.threatLevel === 'CRITICAL' || item.threatIndex >= 70;
              const isSuspicious = item.threatLevel === 'SUSPICIOUS' || (item.threatIndex >= 35 && item.threatIndex < 70);

              return (
                <div
                  key={item.id}
                  className="vault-item-card"
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.15rem', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      setExpandedId(isExpanded ? null : item.id);
                      soundFx.playClick();
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: isCritical ? 'var(--danger-bg)' : isSuspicious ? 'var(--warn-bg)' : 'var(--safe-bg)',
                        color: isCritical ? 'var(--accent-rose)' : isSuspicious ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                      }}>
                        {isCritical ? <ShieldAlert className="w-4 h-4" /> :
                         isSuspicious ? <AlertTriangle className="w-4 h-4" /> :
                         <ShieldCheck className="w-4 h-4" />}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--headline)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                            {item.payloadSnippet || 'Empty Payload'}
                          </span>
                          <span className="badge-pill" style={{ fontSize: '0.68rem', textTransform: 'uppercase', background: 'var(--surface-card)', border: '1px solid var(--card-border)' }}>
                            {item.payloadType || 'text'}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span>{item.timestamp ? String(item.timestamp).slice(0, 16).replace('T', ' ') : 'Recent'}</span>
                          <span>•</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{item.primaryVector || 'Phishing / Fraud'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className={`font-display ${
                          isCritical ? 'text-danger' :
                          isSuspicious ? 'text-amber' :
                          'text-emerald'
                        }`} style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                          {item.threatIndex}%
                        </div>
                        <span className="metric-label" style={{ fontSize: '0.62rem', display: 'block' }}>
                          Threat
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div style={{ padding: '0.85rem 1.15rem 1.15rem', borderTop: '1px solid var(--card-border)', fontSize: '0.78rem' }} className="stack-gap-3 animate-fadeIn">
                      <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'var(--surface-card)', border: '1px solid var(--card-border)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', lineHeight: 1.6, color: 'var(--body)' }}>
                        "{item.payloadSnippet}"
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', textAlign: 'center' }}>
                        <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'var(--surface-card)', border: '1px solid var(--card-border)' }}>
                          <span className="metric-label" style={{ fontSize: '0.64rem', display: 'block' }}>AI Score</span>
                          <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--headline)' }}>{item.aiScore || 0}%</span>
                        </div>
                        <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'var(--surface-card)', border: '1px solid var(--card-border)' }}>
                          <span className="metric-label" style={{ fontSize: '0.64rem', display: 'block' }}>Link Score</span>
                          <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--headline)' }}>{item.linkScore || 0}%</span>
                        </div>
                        <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'var(--surface-card)', border: '1px solid var(--card-border)' }}>
                          <span className="metric-label" style={{ fontSize: '0.64rem', display: 'block' }}>Threat Tier</span>
                          <span className={`font-mono ${
                            isCritical ? 'text-danger' : isSuspicious ? 'text-amber' : 'text-emerald'
                          }`} style={{ fontWeight: 800, fontSize: '0.85rem' }}>{item.threatLevel}</span>
                        </div>
                        <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'var(--surface-card)', border: '1px solid var(--card-border)' }}>
                          <span className="metric-label" style={{ fontSize: '0.64rem', display: 'block' }}>Log ID</span>
                          <span className="font-mono text-muted" style={{ fontWeight: 700, fontSize: '0.85rem' }}>#{item.id}</span>
                        </div>
                      </div>

                      {/* Action Bar inside item */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.65rem', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(item.id, item.payloadSnippet)}
                          className="quick-action-pill"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === item.id ? 'Copied' : 'Copy Payload'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playDeflectorEngage();
                            onSelectPayload(item.payloadSnippet);
                          }}
                          className="btn-pill-deflect"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Re-Analyze in Deflector</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
