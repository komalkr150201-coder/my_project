import React, { useState, useMemo } from 'react';
import {
  Flame,
  AlertOctagon,
  DollarSign,
  Clock,
  Zap,
  RotateCcw
} from 'lucide-react';
import soundFx from '../utils/AudioEngine';

export default function ThreatCrucible({ onSendToDeflector }) {
  // Simulator Controls
  const [hourlyRate, setHourlyRate] = useState(65);
  const [urgencyLevel, setUrgencyLevel] = useState(4); // 1 to 5
  const [checkAmount, setCheckAmount] = useState(3800);
  const [fakeCheckEnabled, setFakeCheckEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [upfrontFeeEnabled, setUpfrontFeeEnabled] = useState(false);
  const [noInterviewEnabled, setNoInterviewEnabled] = useState(true);
  const [shortUrlEnabled, setShortUrlEnabled] = useState(false);

  // Calculate simulated threat dynamics
  const simulation = useMemo(() => {
    let score = 10;
    const flags = [];

    // Salary inflation indicator
    if (hourlyRate >= 50 && hourlyRate < 80) {
      score += 15;
      flags.push(`Inflated hourly wage ($${hourlyRate}/hr) for entry/remote position`);
    } else if (hourlyRate >= 80) {
      score += 25;
      flags.push(`Unrealistically high hourly rate ($${hourlyRate}/hr) designed as psychological bait`);
    }

    // Urgency level
    if (urgencyLevel >= 4) {
      score += 20;
      flags.push(`High artificial urgency (${urgencyLevel === 5 ? 'Immediate / 2hr deadline' : '24-hour expiration'}) to bypass critical thinking`);
    }

    // Fake Check / Equipment Fraud
    if (fakeCheckEnabled) {
      score += 35;
      flags.push(`Cashier's check ($${checkAmount.toLocaleString()}) advance deposit scam mechanism`);
    }

    // Telegram / Off-platform redirect
    if (telegramEnabled) {
      score += 25;
      flags.push('Off-platform communication trap (Telegram / encrypted handle bypassing corporate channels)');
    }

    // Upfront Fee
    if (upfrontFeeEnabled) {
      score += 35;
      flags.push('Upfront advance-fee requirement (deposit for onboarding/screening)');
    }

    // No Interview
    if (noInterviewEnabled) {
      score += 20;
      flags.push('Instant hiring without technical screening or interview');
    }

    // Shortened URL
    if (shortUrlEnabled) {
      score += 20;
      flags.push('Obfuscated link hiding true destination domain');
    }

    const threatIndex = Math.min(100, Math.max(5, score));
    const level = threatIndex >= 70 ? 'CRITICAL' : threatIndex >= 35 ? 'SUSPICIOUS' : 'SAFE';

    return { threatIndex, level, flags };
  }, [hourlyRate, urgencyLevel, checkAmount, fakeCheckEnabled, telegramEnabled, upfrontFeeEnabled, noInterviewEnabled, shortUrlEnabled]);

  // Synthesize realistic scam text from crucible parameters
  const generatedText = useMemo(() => {
    let text = `Congratulations! You have been selected for the Remote Associate role at Global Logix. Compensation is $${hourlyRate}/hr with flexible remote hours. `;

    if (noInterviewEnabled) {
      text += `Due to your outstanding profile, NO formal interview is necessary — you are approved to start immediately. `;
    }

    if (fakeCheckEnabled) {
      text += `We will deliver a certified cashier's check of $${checkAmount.toLocaleString()} to your address. You must deposit this into your personal account today and wire $${Math.max(100, checkAmount - 450)} to our designated hardware vendor for your home office workstation. `;
    }

    if (upfrontFeeEnabled) {
      text += `Please submit a $175 refundable credential screening deposit via Zelle or CashApp before your onboarding call. `;
    }

    if (urgencyLevel >= 4) {
      text += `URGENT: This offer expires within ${urgencyLevel === 5 ? '2 hours' : '24 hours'}. Immediate confirmation is mandatory. `;
    }

    if (telegramEnabled) {
      text += `Contact our Senior Hiring Director immediately on Telegram: @GlobalRecruiter_Executive to complete intake. `;
    }

    if (shortUrlEnabled) {
      text += `Submit your bank routing information here: http://bit.ly/secure-direct-deposit-login`;
    }

    return text.trim();
  }, [hourlyRate, urgencyLevel, checkAmount, fakeCheckEnabled, telegramEnabled, upfrontFeeEnabled, noInterviewEnabled, shortUrlEnabled]);

  const handleReset = () => {
    soundFx.playClick();
    setHourlyRate(25);
    setUrgencyLevel(1);
    setCheckAmount(1000);
    setFakeCheckEnabled(false);
    setTelegramEnabled(false);
    setUpfrontFeeEnabled(false);
    setNoInterviewEnabled(false);
    setShortUrlEnabled(false);
  };

  const handleSendToDeflector = () => {
    soundFx.playDeflectorEngage();
    onSendToDeflector(generatedText);
  };

  return (
    <div className="threat-crucible-card animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.14)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)' }}>
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--headline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Threat Crucible Simulator
              <span className="badge-pill" style={{ background: 'rgba(245, 158, 11, 0.14)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                Interactive Lab
              </span>
            </h3>
            <p className="text-muted" style={{ fontSize: '0.78rem' }}>
              Manipulate deceptive vectors and watch the neural threat score calculate in real-time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="btn-gravi-secondary"
          title="Reset to safe baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Baseline</span>
        </button>
      </div>

      {/* Grid Layout (7 cols vs 5 cols) */}
      <div className="crucible-grid" style={{ marginTop: '1.5rem' }}>
        
        {/* Left Column: Sliders & Mechanics */}
        <div className="stack-gap-4">
          
          {/* Sliders Card */}
          <div style={{ padding: '1.25rem', borderRadius: '20px', background: 'var(--surface-inset)', border: '1px solid var(--card-border)' }} className="stack-gap-4">
            {/* Hourly Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--headline)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign className="w-3.5 h-3.5 text-emerald" />
                  Proposed Hourly Rate
                </span>
                <span className="font-mono text-emerald" style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                  ${hourlyRate}/hr
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="200"
                step="5"
                value={hourlyRate}
                onChange={(e) => {
                  setHourlyRate(Number(e.target.value));
                  soundFx.playClick();
                }}
                className="crucible-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                <span>$15 (Standard)</span>
                <span>$75 (High)</span>
                <span>$200 (Extreme Bait)</span>
              </div>
            </div>

            {/* Urgency Level Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--headline)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock className="w-3.5 h-3.5 text-amber" />
                  Psychological Urgency Pressure
                </span>
                <span className="font-mono text-amber" style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                  Tier {urgencyLevel} / 5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={urgencyLevel}
                onChange={(e) => {
                  setUrgencyLevel(Number(e.target.value));
                  soundFx.playClick();
                }}
                className="crucible-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                <span>Standard</span>
                <span>Moderate</span>
                <span>Panicked 2hr Deadline</span>
              </div>
            </div>

            {/* Cashier Check Amount */}
            {fakeCheckEnabled && (
              <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--card-border)' }} className="animate-fadeIn">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--headline)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign className="w-3.5 h-3.5 text-danger" />
                    Cashier's Check Face Value
                  </span>
                  <span className="font-mono text-danger" style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                    ${checkAmount.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="6000"
                  step="100"
                  value={checkAmount}
                  onChange={(e) => {
                    setCheckAmount(Number(e.target.value));
                    soundFx.playClick();
                  }}
                  className="crucible-slider"
                />
              </div>
            )}
          </div>

          {/* Feature Toggles Card */}
          <div style={{ padding: '1.25rem', borderRadius: '20px', background: 'var(--surface-inset)', border: '1px solid var(--card-border)' }} className="stack-gap-2">
            <span className="metric-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Deceptive Vectors & Fraud Mechanisms
            </span>

            <label className="toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={fakeCheckEnabled}
                  onChange={(e) => {
                    setFakeCheckEnabled(e.target.checked);
                    soundFx.playClick();
                  }}
                  className="toggle-checkbox"
                />
                <div>
                  <span className="toggle-title">Cashier's Check / Equipment Deposit Fraud</span>
                  <p className="toggle-sub">Employer sends paper check and requests wire back to vendor</p>
                </div>
              </div>
            </label>

            <label className="toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => {
                    setTelegramEnabled(e.target.checked);
                    soundFx.playClick();
                  }}
                  className="toggle-checkbox"
                />
                <div>
                  <span className="toggle-title">Off-Platform Redirection (Telegram / Signal)</span>
                  <p className="toggle-sub">Requires chatting with anonymous handles outside corporate email</p>
                </div>
              </div>
            </label>

            <label className="toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={upfrontFeeEnabled}
                  onChange={(e) => {
                    setUpfrontFeeEnabled(e.target.checked);
                    soundFx.playClick();
                  }}
                  className="toggle-checkbox"
                />
                <div>
                  <span className="toggle-title">Advance Screening / Registration Fee</span>
                  <p className="toggle-sub">Demands upfront background check deposit or registration fee</p>
                </div>
              </div>
            </label>

            <label className="toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={noInterviewEnabled}
                  onChange={(e) => {
                    setNoInterviewEnabled(e.target.checked);
                    soundFx.playClick();
                  }}
                  className="toggle-checkbox"
                />
                <div>
                  <span className="toggle-title">Zero Interview Instant Hiring</span>
                  <p className="toggle-sub">Candidate hired immediately without video or phone evaluation</p>
                </div>
              </div>
            </label>

            <label className="toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={shortUrlEnabled}
                  onChange={(e) => {
                    setShortUrlEnabled(e.target.checked);
                    soundFx.playClick();
                  }}
                  className="toggle-checkbox"
                />
                <div>
                  <span className="toggle-title">Obfuscated Verification Link (bit.ly / ip)</span>
                  <p className="toggle-sub">Includes a shortened direct deposit / banking credential link</p>
                </div>
              </div>
            </label>
          </div>

        </div>

        {/* Right Column: Score Gauge & Payload Preview */}
        <div className="stack-gap-4">
          
          {/* Dynamic Score Meter Card */}
          <div style={{ padding: '1.5rem', borderRadius: '20px', background: 'var(--surface-inset)', border: '1px solid var(--card-border)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <span className="metric-label">Simulated Threat Index</span>
              <span className={`badge-pill ${
                simulation.level === 'CRITICAL' ? 'text-danger' :
                simulation.level === 'SUSPICIOUS' ? 'text-amber' :
                'text-emerald'
              }`} style={{
                background: simulation.level === 'CRITICAL' ? 'var(--danger-bg)' : simulation.level === 'SUSPICIOUS' ? 'var(--warn-bg)' : 'var(--safe-bg)',
                border: `1px solid ${simulation.level === 'CRITICAL' ? 'var(--danger-border)' : simulation.level === 'SUSPICIOUS' ? 'var(--warn-border)' : 'var(--safe-border)'}`
              }}>
                {simulation.level}
              </span>
            </div>

            <div style={{ margin: '1rem 0' }}>
              <div className={`font-display ${
                simulation.threatIndex >= 70 ? 'text-danger' :
                simulation.threatIndex >= 35 ? 'text-amber' :
                'text-emerald'
              }`} style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1 }}>
                {simulation.threatIndex}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.35rem' }}>
                Calculated Scam Probability
              </div>
            </div>

            {/* Progress Bar */}
            <div className="risk-mini-bar" style={{ margin: '0.85rem 0' }}>
              <div
                className="risk-mini-fill"
                style={{
                  width: `${simulation.threatIndex}%`,
                  background: simulation.threatIndex >= 70 ? 'var(--accent-rose)' : simulation.threatIndex >= 35 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                }}
              />
            </div>

            {/* Active Flags List */}
            <div style={{ textAlign: 'left', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--card-border)' }}>
              <span className="metric-label text-danger" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.5rem' }}>
                <AlertOctagon className="w-3.5 h-3.5" />
                Active Risk Factors ({simulation.flags.length})
              </span>
              <div style={{ maxHeight: '140px', overflowY: 'auto' }} className="stack-gap-2">
                {simulation.flags.length === 0 ? (
                  <p className="text-emerald" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>
                    No suspicious markers active. Payload appears benign.
                  </p>
                ) : (
                  simulation.flags.map((flag, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.76rem', color: 'var(--body)' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-rose)', marginTop: '5px', flexShrink: 0 }} />
                      <span>{flag}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Live Synthesized Payload Card */}
          <div style={{ padding: '1.25rem', borderRadius: '20px', background: 'var(--surface-inset)', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span className="metric-label">Live Synthesized Payload</span>
              <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>{generatedText.length} chars</span>
            </div>
            <div style={{ padding: '0.85rem', borderRadius: '14px', background: 'var(--surface-card)', border: '1px solid var(--card-border)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6, color: 'var(--body)' }}>
              "{generatedText}"
            </div>

            {/* Deflector Engagement Button */}
            <button
              type="button"
              onClick={handleSendToDeflector}
              className="btn-deflector"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              <Zap className="w-4 h-4" />
              <span>Send to Neural Deflector</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
