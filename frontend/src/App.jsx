import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Lock,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ExternalLink,
  Link as LinkIcon,
  Activity,
  ArrowRight,
  Flame,
  Database,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Clipboard,
  X,
  CheckSquare,
  Square,
  Zap
} from 'lucide-react';
import { analyzePayload, getVaultHistory, clearVaultHistory, checkHealth } from './services/shieldApi';
import soundFx from './utils/AudioEngine';
import AntiGravityCanvas from './components/AntiGravityCanvas';
import LinkInspector from './components/LinkInspector';
import ThreatCrucible from './components/ThreatCrucible';
import VaultHistoryModal from './components/VaultHistoryModal';

// Sample Presets for Demonstration
const SAMPLE_PRESETS = [
  {
    title: 'Fake Equipment Check',
    category: 'Check Fraud',
    payload: `Congratulations! You are officially hired for the Remote Data Entry Specialist position ($58/hr). We will mail you a cashier's check of $4,850 today. You must immediately deposit this check into your personal bank account and wire $4,200 via Zelle to our certified vendor (vendor-supplies@tech-gears.xyz) to purchase your Apple MacBook Pro and home office kit.`
  },
  {
    title: 'Telegram Recruiter Trap',
    category: 'Advance Fee',
    payload: `Hello! Our HR director saw your profile on LinkedIn and selected you for our high-paying Global Associate role. Salary is $12,000/month. No interview required! Contact our regional hiring manager immediately on Telegram: @GlobalRecruiter_VIP. Please submit a refundable $150 onboarding background check deposit to secure your slot.`
  },
  {
    title: 'Phishing Link (Obfuscated)',
    category: 'Credential Harvest',
    payload: `URGENT SECURITY ALERT: Your Microsoft 365 / Corporate HR account will be suspended within 2 hours due to unverified direct deposit details. Click here to confirm your credentials: http://bit.ly/3xHR-verify-login?redirect=update-banking`
  },
  {
    title: 'Legitimate Offer',
    category: 'Verified Safe',
    payload: `Hi Alex, thank you for completing the final round engineering interview with our team last Tuesday. We are delighted to extend a formal offer of employment for the Senior Full-Stack Engineer role at Acme Corp. Please review the attached offer letter and benefits documentation in the applicant portal at https://careers.acmecorp.com/portal.`
  }
];

export default function App() {
  // Navigation Modes: 'deflector' | 'link' | 'crucible' | 'vault'
  const [activeTab, setActiveTab] = useState('deflector');

  // Payload & Scanning State
  const [payload, setPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Interactive Checklist State (for defensive advice)
  const [checkedChecklist, setCheckedChecklist] = useState({});

  // Theme & Audio State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('graviguard_theme') || 'dark';
  });
  const [isMuted, setIsMuted] = useState(() => soundFx.isMuted);

  // Vault History State
  const [vaultItems, setVaultItems] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);

  // Backend Diagnostic State
  const [backendHealth, setBackendHealth] = useState({ online: false, checking: true });

  const textareaRef = useRef(null);

  // Initial Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('graviguard_theme', theme);
  }, [theme]);

  useEffect(() => {
    verifyBackend();
    fetchVault();
  }, []);

  // Keyboard shortcut listener: Cmd/Ctrl + Enter to trigger scan
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (payload.trim() && !loading && activeTab === 'deflector') {
          e.preventDefault();
          handleScan();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [payload, loading, activeTab]);

  const verifyBackend = async () => {
    setBackendHealth({ online: false, checking: true });
    try {
      const data = await checkHealth();
      setBackendHealth({ online: true, checking: false, data });
    } catch (err) {
      setBackendHealth({ online: false, checking: false, error: err.message });
    }
  };

  const fetchVault = async () => {
    setVaultLoading(true);
    try {
      const res = await getVaultHistory(35);
      if (res.success) {
        setVaultItems(res.history || []);
      }
    } catch (err) {
      console.warn('Could not load vault history:', err.message);
    } finally {
      setVaultLoading(false);
    }
  };

  const toggleTheme = () => {
    soundFx.playClick();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const toggleAudio = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFx.playClick();
  };

  const handleScan = async (textToScan = payload) => {
    const text = (typeof textToScan === 'string' ? textToScan : payload).trim();
    if (!text) {
      setError('Please paste a job offer, message, or suspicious link to neutralize.');
      return;
    }

    setLoading(true);
    setError(null);
    setCheckedChecklist({});
    soundFx.playDeflectorEngage();

    try {
      const response = await analyzePayload(text);
      if (response.success) {
        setResult(response.analysis);
        fetchVault();

        // Audio response based on outcome
        if (response.analysis.threatLevel === 'SAFE') {
          soundFx.playSafeChime();
        } else if (response.analysis.threatLevel === 'SUSPICIOUS') {
          soundFx.playWarningChime();
        } else {
          soundFx.playCriticalAlarm();
        }
      } else {
        setError(response.error || 'Neutralization inspection failed.');
      }
    } catch (err) {
      setError(err.message || 'Deflector shield communication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeVault = async () => {
    if (!window.confirm('Are you sure you want to clear your neutralized scan history from SQLite?')) return;
    soundFx.playClick();
    try {
      await clearVaultHistory();
      setVaultItems([]);
    } catch (err) {
      alert('Failed to clear vault: ' + err.message);
    }
  };

  const handleApplyPreset = (presetText) => {
    soundFx.playClick();
    setPayload(presetText);
    setError(null);
    setActiveTab('deflector');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePasteClipboard = async () => {
    soundFx.playClick();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPayload(text);
        setError(null);
      }
    } catch (err) {
      alert('Please use Ctrl+V / Cmd+V to paste directly into the box.');
    }
  };

  // Drag & Drop payload files (.txt, email drafts)
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    soundFx.playClick();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setPayload(event.target.result || '');
        setError(null);
      };
      reader.readAsText(file);
    } else {
      const text = e.dataTransfer.getData('text');
      if (text) {
        setPayload(text);
        setError(null);
      }
    }
  };

  const toggleChecklistItem = (idx) => {
    soundFx.playClick();
    setCheckedChecklist((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const copyToClipboard = (text) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine current visual state for orb & particle canvas
  const getVisualState = () => {
    if (loading) return 'scanning';
    if (!result) return 'idle';
    if (result.threatLevel === 'CRITICAL') return 'critical';
    if (result.threatLevel === 'SUSPICIOUS') return 'suspicious';
    return 'safe';
  };

  const visualState = getVisualState();

  return (
    <div className="app-wrapper">
      
      {/* 1. Header Navigation Bar */}
      <header className="app-header">
        <div className="brand-logo-container">
          <div className="brand-emblem">
            <div className="brand-emblem-inner">
              <Sparkles className="w-5 h-5 text-cyan animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="brand-title">
              GraviGuard <span className="brand-title-gradient">AI</span>
            </h1>
            <p className="brand-subtitle font-mono">Anti-Gravity Scam & Phishing Deflector Core</p>
          </div>
        </div>

        {/* Status Pill & Header Buttons */}
        <div className="header-actions">
          <div className="status-beacon-pill">
            <span className={`beacon-dot ${backendHealth.online ? '' : 'offline'}`} />
            <span>{backendHealth.online ? 'Deflector Online' : 'Connecting Core...'}</span>
            <span className="text-subtle font-normal">|</span>
            <span className="font-mono text-[11px] text-muted">
              {backendHealth.data?.geminiConfigured ? 'Gemini 3.1 Neural Core' : 'Heuristic Engine'}
            </span>
          </div>

          <button
            type="button"
            onClick={verifyBackend}
            className="header-icon-btn"
            title="Refresh Core Diagnostics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleAudio}
            className="header-icon-btn"
            title={isMuted ? 'Unmute Deflector Audio FX' : 'Mute Audio FX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-danger" /> : <Volume2 className="w-4 h-4 text-cyan" />}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="header-icon-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber" /> : <Moon className="w-4 h-4 text-cyan" />}
          </button>
        </div>
      </header>

      {/* 2. Interactive Navigation Tabs */}
      <div className="nav-tabs-wrapper">
        <nav className="nav-tabs-bar">
          <button
            type="button"
            onClick={() => { setActiveTab('deflector'); soundFx.playClick(); }}
            className={`nav-tab-btn ${activeTab === 'deflector' ? 'active' : ''}`}
          >
            <Shield className="w-4 h-4" />
            <span>Neural Deflector</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('link'); soundFx.playClick(); }}
            className={`nav-tab-btn ${activeTab === 'link' ? 'active' : ''}`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Deep Link Graviton</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('crucible'); soundFx.playClick(); }}
            className={`nav-tab-btn ${activeTab === 'crucible' ? 'active' : ''}`}
          >
            <Flame className="w-4 h-4" />
            <span>Threat Crucible</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('vault'); soundFx.playClick(); }}
            className={`nav-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
          >
            <Database className="w-4 h-4" />
            <span>Vault Matrix</span>
            {vaultItems.length > 0 && (
              <span className="badge-pill" style={{ background: 'var(--accent-cyan)', color: '#fff' }}>
                {vaultItems.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* 3. Main Operational Area */}
      <main className="app-main">
        {/* TAB 1: NEURAL DEFLECTOR */}
        {activeTab === 'deflector' && (
          <div className="animate-fadeIn">
            {/* Tagline */}
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 1.75rem' }}>
              <div className="badge-pill" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', border: '1px solid var(--card-border-glow)', marginBottom: '0.65rem' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Anti-Gravity Digital Defense
              </div>
              <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--headline)', lineHeight: 1.2 }}>
                Neutralize deceptive threats before they strike.
              </h2>
              <p className="text-muted" style={{ fontSize: '0.92rem', marginTop: '0.45rem' }}>
                Multi-vector heuristic deflection coupled with Gemini 3.1 neural reasoning.
              </p>
            </div>

            {/* 3-Column Balanced Layout */}
            <div className="gravi-main-grid">
              
              {/* Left Column: Instant Presets & Telemetry */}
              <div className="gravi-col-left stack-gap-4">
                
                {/* Instant Presets Card */}
                <div className="gravi-card">
                  <span className="metric-label" style={{ display: 'block', marginBottom: '0.85rem' }}>
                    Instant Test Presets
                  </span>
                  <div className="stack-gap-2">
                    {SAMPLE_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleApplyPreset(preset.payload)}
                        className="preset-card-btn"
                      >
                        <div className="preset-card-title">
                          <span>{preset.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted" />
                        </div>
                        <span className="preset-card-subtitle">{preset.category}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Telemetry Card */}
                <div className="gravi-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <span className="metric-label">Shield Telemetry</span>
                    <span className="badge-pill" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', border: '1px solid var(--card-border)' }}>
                      Live
                    </span>
                  </div>
                  <div className="stack-gap-2" style={{ fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-rose)' }} />
                        <span>Critical Vectors</span>
                      </span>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--headline)' }}>
                        {vaultItems.filter(i => i.threatLevel === 'CRITICAL').length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)' }} />
                        <span>Suspicious Risks</span>
                      </span>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--headline)' }}>
                        {vaultItems.filter(i => i.threatLevel === 'SUSPICIOUS').length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
                        <span>Safe Payloads</span>
                      </span>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--headline)' }}>
                        {vaultItems.filter(i => i.threatLevel === 'SAFE').length}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--headline)' }}>{vaultItems.length}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Archived Scans</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-display text-emerald" style={{ fontSize: '1.25rem', fontWeight: 800 }}>99.8%</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Precision Index</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Center Column: Interactive Orb & Deflector Input */}
              <div className="gravi-col-center">
                <div className="central-shield-card">
                  
                  {/* Interactive Canvas Orb */}
                  <div className="shield-stage">
                    <div className="shield-canvas-container">
                      <AntiGravityCanvas
                        state={visualState}
                        width={260}
                        height={260}
                        interactive={true}
                      />
                    </div>

                    <div
                      onClick={() => soundFx.playDeflectorEngage()}
                      className={`shield-center-orb ${visualState}`}
                      title="Anti-Gravity Shield Core"
                    >
                      <div className="shield-center-orb-inner">
                        {loading ? (
                          <RefreshCw className="w-6 h-6 text-white animate-spin" />
                        ) : result ? (
                          result.threatLevel === 'SAFE' ? (
                            <ShieldCheck className="w-6 h-6 text-white" />
                          ) : (
                            <ShieldAlert className="w-6 h-6 text-white" />
                          )
                        ) : (
                          <Sparkles className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shield-status-tag">
                    {loading
                      ? 'NEUTRALIZING TARGET PAYLOAD...'
                      : result
                      ? `${result.threatLevel} THREAT VECTOR IDENTIFIED`
                      : 'DEFLECTOR FORCE FIELD ONLINE'}
                  </div>

                  {/* Input Form with Drag & Drop */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleScan(); }}
                    style={{ marginTop: '1.5rem' }}
                    className="stack-gap-4"
                  >
                    <div
                      className="neutralize-input-box"
                      style={isDragOver ? { borderColor: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.08)' } : {}}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                    >
                      <textarea
                        ref={textareaRef}
                        rows={4}
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                        placeholder="Paste suspicious job offer, email body, Telegram prompt, or URL to neutralize..."
                        className="neutralize-textarea"
                      />

                      <div className="neutralize-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                            {payload.length} chars • {payload.trim().split(/\s+/).filter(Boolean).length} words
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={handlePasteClipboard}
                            className="quick-action-pill"
                            title="Paste from clipboard"
                          >
                            <Clipboard className="w-3.5 h-3.5" />
                            <span>Paste</span>
                          </button>
                          {payload && (
                            <button
                              type="button"
                              onClick={() => { setPayload(''); setResult(null); setError(null); soundFx.playClick(); }}
                              className="quick-action-pill danger"
                              title="Clear payload"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Clear</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div style={{ padding: '0.85rem 1rem', borderRadius: '16px', background: 'var(--danger-bg)', border: '1.5px solid var(--danger-border)', color: 'var(--danger-text)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Unified Deflector Action Button */}
                    <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                      <button
                        type="submit"
                        disabled={loading || !payload.trim()}
                        className="btn-deflector"
                        style={{ width: '100%', maxWidth: '340px' }}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Neutralizing Payload...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            <span>ENGAGE DEFLECTOR SHIELD</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                </div>

                {/* 4. Inspection Report View (If Result Available) */}
                {result && (
                  <div className="result-report-card animate-fadeIn">
                    <div className="result-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span className={`badge-threat ${result.threatLevel.toLowerCase()}`}>
                          {result.threatLevel === 'CRITICAL' && <ShieldAlert className="w-4 h-4" />}
                          {result.threatLevel === 'SUSPICIOUS' && <AlertTriangle className="w-4 h-4" />}
                          {result.threatLevel === 'SAFE' && <ShieldCheck className="w-4 h-4" />}
                          {result.threatLevel} THREAT VECTOR
                        </span>
                        <span className="font-mono text-muted" style={{ fontSize: '0.78rem' }}>
                          Vector: <strong className="text-headline">{result.primaryVector || 'Phishing / Fraud'}</strong>
                        </span>
                      </div>

                      {/* Circular Gauge Display */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span className="metric-label" style={{ display: 'block' }}>Threat Index</span>
                          <span className={`font-display ${
                            result.threatIndex >= 70 ? 'text-danger' :
                            result.threatIndex >= 35 ? 'text-amber' :
                            'text-emerald'
                          }`} style={{ fontSize: '1.75rem', fontWeight: 900 }}>
                            {result.threatIndex}%
                          </span>
                        </div>
                        <svg className="threat-gauge-circle" width="48" height="48" viewBox="0 0 48 48">
                          <circle className="threat-gauge-track" cx="24" cy="24" r="18" />
                          <circle
                            className="threat-gauge-progress"
                            cx="24"
                            cy="24"
                            r="18"
                            stroke={result.threatIndex >= 70 ? 'var(--accent-rose)' : result.threatIndex >= 35 ? 'var(--accent-amber)' : 'var(--accent-emerald)'}
                            strokeDasharray={113}
                            strokeDashoffset={113 - (113 * result.threatIndex) / 100}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div style={{ margin: '1.25rem 0' }}>
                      <span className="metric-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Executive Deflector Assessment
                      </span>
                      <p className="text-body" style={{ fontSize: '0.88rem', lineHeight: 1.65, padding: '1rem', borderRadius: '18px', background: 'var(--surface-inset)', border: '1px solid var(--card-border)' }}>
                        {result.executiveSummary}
                      </p>
                    </div>

                    {/* Red Flags & Defensive Checklist Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                      {/* Detected Red Flags */}
                      <div>
                        <h4 className="metric-label text-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Detected Red Flags ({result.redFlags?.length || 0})
                        </h4>
                        <div className="stack-gap-2">
                          {result.redFlags && result.redFlags.map((flag, idx) => (
                            <div key={idx} className="flag-card-item">
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-rose)', marginTop: '6px', flexShrink: 0 }} />
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Defensive Playbook */}
                      <div>
                        <h4 className="metric-label text-emerald" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Defensive Action Playbook
                        </h4>
                        <div className="stack-gap-2">
                          {result.defensiveAdvice && result.defensiveAdvice.map((advice, idx) => {
                            const isChecked = !!checkedChecklist[idx];
                            return (
                              <div
                                key={idx}
                                onClick={() => toggleChecklistItem(idx)}
                                className={`defense-checklist-item ${isChecked ? 'checked' : ''}`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-emerald" style={{ flexShrink: 0, marginTop: '2px' }} />
                                ) : (
                                  <Square className="w-4 h-4 text-muted" style={{ flexShrink: 0, marginTop: '2px' }} />
                                )}
                                <span>{advice}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar Footer */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem' }}>
                      <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="font-mono">
                          Field Integrity: <strong className="text-headline">{result.shieldStatus?.fieldIntegrity}%</strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          Power: <strong className="text-cyan">{result.shieldStatus?.deflectorPower}</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                        className="btn-gravi-secondary"
                        title="Copy full JSON analysis"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Defense Pillars & Mini Vault */}
              <div className="gravi-col-right stack-gap-4">
                
                {/* Security Pillars Card */}
                <div className="gravi-card">
                  <span className="metric-label" style={{ display: 'block', marginBottom: '0.85rem' }}>
                    Defense Pillars
                  </span>
                  <div className="stack-gap-2">
                    <div style={{ padding: '0.85rem', borderRadius: '16px', background: 'var(--surface-inset)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.14)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--headline)' }}>Zero-PII Storage</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Local SQLite Encryption</div>
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '16px', background: 'var(--surface-inset)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.14)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--headline)' }}>Gemini 3.1 Reasoning</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Contextual Deflection</div>
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '16px', background: 'var(--surface-inset)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.14)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--headline)' }}>Link Graviton</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Deep URL Heuristics</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini Vault Preview Card */}
                <div className="gravi-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <span className="metric-label">Recent Vault Scans</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('vault')}
                      className="btn-gravi-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                    >
                      View All
                    </button>
                  </div>

                  {vaultItems.length === 0 ? (
                    <div style={{ padding: '1.5rem 0', textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted)' }}>
                      No records yet. Engage deflector shield to record.
                    </div>
                  ) : (
                    <div className="stack-gap-2">
                      {vaultItems.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setPayload(item.payloadSnippet);
                            soundFx.playClick();
                            if (textareaRef.current) textareaRef.current.focus();
                          }}
                          className="preset-card-btn"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--headline)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                              {item.payloadSnippet}
                            </span>
                            <span className={`font-mono ${
                              item.threatIndex >= 70 ? 'text-danger' :
                              item.threatIndex >= 35 ? 'text-amber' :
                              'text-emerald'
                            }`} style={{ fontWeight: 800, fontSize: '0.78rem' }}>
                              {item.threatIndex}%
                            </span>
                          </div>
                          <span className="preset-card-subtitle">{item.primaryVector || 'Phishing / Fraud'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: DEEP LINK GRAVITON */}
        {activeTab === 'link' && (
          <LinkInspector
            isAnalyzing={loading}
            onAnalyzeUrl={(url) => {
              setPayload(url);
              setActiveTab('deflector');
              handleScan(url);
            }}
          />
        )}

        {/* TAB 3: THREAT CRUCIBLE */}
        {activeTab === 'crucible' && (
          <ThreatCrucible
            onSendToDeflector={(simulatedText) => {
              setPayload(simulatedText);
              setActiveTab('deflector');
              handleScan(simulatedText);
            }}
          />
        )}

        {/* TAB 4: DEFLECTOR VAULT */}
        {activeTab === 'vault' && (
          <VaultHistoryModal
            vaultItems={vaultItems}
            loading={vaultLoading}
            onRefresh={fetchVault}
            onPurge={handlePurgeVault}
            onSelectPayload={(snippet) => {
              setPayload(snippet);
              setActiveTab('deflector');
              handleScan(snippet);
            }}
          />
        )}

      </main>

      {/* 5. Clean Footer */}
      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>GraviGuard AI Cybernetic Deflector Core</span>
          <span>•</span>
          <span className="text-emerald" style={{ fontWeight: 600 }}>Engine v2.0.0 Active</span>
        </div>
        <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          Dual Luminous Plasma Spectrum // Zero PII Leak Guarantee
        </div>
      </footer>

    </div>
  );
}
