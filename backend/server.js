import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initVault, logThreatScan, getVaultHistory, clearVaultHistory } from './vault.js';
import { inspectGravityShield } from './gravityShield.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

function sanitizeOutput(text) {
  if (!text) return '';
  return String(text).replace(/(?:key|apiKey)=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]');
}

const app = express();
const PORT = process.env.PORT || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Configure Middleware
app.use(cors({
  origin: '*', // Allow frontend development clients
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Initialize SQLite Database
initVault().catch((err) => {
  console.error('[Server] Failed to initialize SQLite Vault database:', err);
});

/* ==========================================================================
   ROUTES
   ========================================================================== */

/**
 * GET /api/health
 * System health and diagnostic check
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Anti-Gravity Shield Deflector Core',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * POST /api/analyze
 * Analyzes communication payload or URL, returns threat index and persists to Vault
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { payload } = req.body;

    if (!payload || typeof payload !== 'string' || !payload.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: "payload" string is required in request body.'
      });
    }

    console.log(`[Server] Analyzing payload (${payload.length} chars)...`);
    const analysis = await inspectGravityShield(payload);

    // Save scan to SQLite Vault
    const vaultRecord = await logThreatScan({
      payloadSnippet: payload.slice(0, 160).replace(/\s+/g, ' '),
      payloadType: analysis.payloadType,
      threatIndex: analysis.threatIndex,
      threatLevel: analysis.threatLevel,
      aiScore: analysis.aiMetrics.score,
      linkScore: analysis.linkMetrics.score,
      redFlags: analysis.redFlags,
      defensiveAdvice: analysis.defensiveAdvice,
      fullDetails: analysis
    });

    return res.status(200).json({
      success: true,
      logId: vaultRecord.id,
      analysis
    });

  } catch (err) {
    console.error('[Server] /api/analyze error:', sanitizeOutput(err.message));
    return res.status(500).json({
      success: false,
      error: sanitizeOutput(err.message) || 'Internal inspection error during shield analysis.'
    });
  }
});

/**
 * GET /api/vault
 * Retrieves chronological deflection logs from SQLite vault
 */
app.get('/api/vault', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const history = await getVaultHistory(limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (err) {
    console.error('[Server] /api/vault error:', sanitizeOutput(err.message));
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve records from Vault database.'
    });
  }
});

/**
 * DELETE /api/vault
 * Resets or clears the deflection history in the vault
 */
app.delete('/api/vault', async (req, res) => {
  try {
    const result = await clearVaultHistory();
    return res.status(200).json({
      success: true,
      message: 'Vault history purged successfully.',
      clearedCount: result.clearedCount
    });
  } catch (err) {
    console.error('[Server] DELETE /api/vault error:', sanitizeOutput(err.message));
    return res.status(500).json({
      success: false,
      error: 'Failed to clear Vault database.'
    });
  }
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled Exception:', sanitizeOutput(err.message));
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: sanitizeOutput(err.message)
  });
});

// Start listening
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🛡️  ANTI-GRAVITY SHIELD BACKEND ACTIVE ON PORT ${PORT}`);
  console.log(`🚀  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`⚡  Analyze Endpoint: POST http://localhost:${PORT}/api/analyze`);
  console.log(`💾  Vault Logs: GET http://localhost:${PORT}/api/vault`);
  console.log('====================================================');
});
