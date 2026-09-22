import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'threats.db');

let dbInstance = null;

/**
 * Get or initialize the SQLite database connection
 */
export function getDbConnection() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('[Vault DB] Error opening SQLite database:', err.message);
      } else {
        console.log(`[Vault DB] SQLite database connected at: ${DB_PATH}`);
      }
    });
  }
  return dbInstance;
}

/**
 * Initializes the threats vault table if it doesn't exist
 */
export function initVault() {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS scan_vault (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        payload_snippet TEXT NOT NULL,
        payload_type TEXT NOT NULL,
        threat_index INTEGER NOT NULL,
        threat_level TEXT NOT NULL,
        ai_score REAL NOT NULL,
        link_score REAL NOT NULL,
        red_flags TEXT NOT NULL,
        defensive_advice TEXT NOT NULL,
        full_details TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_timestamp ON scan_vault(timestamp DESC);
    `;

    db.exec(createTableQuery, (err) => {
      if (err) {
        console.error('[Vault DB] Failed to initialize scan_vault schema:', err.message);
        return reject(err);
      }
      console.log('[Vault DB] scan_vault schema verified & ready.');
      resolve(true);
    });
  });
}

/**
 * Logs a threat scan report into the vault
 * @param {Object} scanData
 */
export function logThreatScan(scanData) {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    const insertQuery = `
      INSERT INTO scan_vault (
        payload_snippet,
        payload_type,
        threat_index,
        threat_level,
        ai_score,
        link_score,
        red_flags,
        defensive_advice,
        full_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const snippet = scanData.payloadSnippet || 
      (typeof scanData.payload === 'string' ? scanData.payload.slice(0, 160) : 'Unknown payload');
    const payloadType = scanData.payloadType || 'text';
    const threatIndex = Math.round(scanData.threatIndex || 0);
    const threatLevel = scanData.threatLevel || 'SAFE';
    const aiScore = Number(scanData.aiScore || 0);
    const linkScore = Number(scanData.linkScore || 0);
    const redFlags = JSON.stringify(scanData.redFlags || []);
    const defensiveAdvice = JSON.stringify(scanData.defensiveAdvice || []);
    const fullDetails = JSON.stringify(scanData.fullDetails || scanData);

    db.run(
      insertQuery,
      [snippet, payloadType, threatIndex, threatLevel, aiScore, linkScore, redFlags, defensiveAdvice, fullDetails],
      function (err) {
        if (err) {
          console.error('[Vault DB] Insert error:', err.message);
          return reject(err);
        }
        resolve({
          id: this.lastID,
          timestamp: new Date().toISOString(),
          snippet,
          payloadType,
          threatIndex,
          threatLevel
        });
      }
    );
  });
}

/**
 * Retrieves the most recent scan records from the vault
 * @param {number} limit 
 */
export function getVaultHistory(limit = 25) {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    const query = `
      SELECT 
        id, 
        timestamp, 
        payload_snippet, 
        payload_type, 
        threat_index, 
        threat_level, 
        ai_score, 
        link_score, 
        red_flags, 
        defensive_advice, 
        full_details
      FROM scan_vault
      ORDER BY id DESC
      LIMIT ?
    `;

    db.all(query, [limit], (err, rows) => {
      if (err) {
        console.error('[Vault DB] Query error:', err.message);
        return reject(err);
      }

      const formatted = (rows || []).map((row) => {
        let parsedFlags = [];
        let parsedAdvice = [];
        let parsedDetails = null;

        try { parsedFlags = JSON.parse(row.red_flags || '[]'); } catch (_) { parsedFlags = []; }
        try { parsedAdvice = JSON.parse(row.defensive_advice || '[]'); } catch (_) { parsedAdvice = []; }
        try { parsedDetails = JSON.parse(row.full_details || '{}'); } catch (_) { parsedDetails = {}; }

        return {
          id: row.id,
          timestamp: row.timestamp,
          payloadSnippet: row.payload_snippet,
          payloadType: row.payload_type,
          threatIndex: row.threat_index,
          threatLevel: row.threat_level,
          aiScore: row.ai_score,
          linkScore: row.link_score,
          redFlags: parsedFlags,
          defensiveAdvice: parsedAdvice,
          fullDetails: parsedDetails
        };
      });

      resolve(formatted);
    });
  });
}

/**
 * Clears scan history from the vault
 */
export function clearVaultHistory() {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    db.run(`DELETE FROM scan_vault`, function (err) {
      if (err) {
        console.error('[Vault DB] Clear error:', err.message);
        return reject(err);
      }
      resolve({ clearedCount: this.changes });
    });
  });
}

export default {
  initVault,
  logThreatScan,
  getVaultHistory,
  clearVaultHistory,
  getDbConnection
};
