/**
 * Netlify Functions API replacement for FastAPI:
 *  - POST   /api/v1/encrypt {key, data}
 *  - POST   /api/v1/decrypt {key, data}
 *  - GET    /api/v1/logs?size=&offset=
 *  - DELETE /api/v1/logs
 */

import fetch from "node-fetch";
import { Client } from "pg";
import crypto from "node:crypto";

// --- helpers ---
const JSON_HEADERS = { "content-type": "application/json" };

function json(body, statusCode = 200) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}
function bad(msg, status = 400) { return json({ detail: msg }, status); }

async function withDb(fn) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL env var not set");
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // ensure table once
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        ip TEXT NOT NULL,
        data TEXT NOT NULL
      );
    `);
    return await fn(client);
  } finally {
    await client.end();
  }
}
function ipFromHeaders(headers = {}) {
  return headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
}
function unixSec() { return Math.floor(Date.now() / 1000); }
function uuid() { return crypto.randomUUID(); }

// PEM validation
function normalizePem(pem) {
  if (typeof pem !== "string") return null;
  return pem
    .replace(/^\uFEFF/, "")  // strip BOM if present
    .replace(/\r/g, "")
    .trim();
}

function isPublicPem(pem) {
  return (
    (pem.startsWith("-----BEGIN PUBLIC KEY-----") && pem.endsWith("-----END PUBLIC KEY-----")) ||
    (pem.startsWith("-----BEGIN RSA PUBLIC KEY-----") && pem.endsWith("-----END RSA PUBLIC KEY-----"))  
  );
}
function isPrivatePem(pem) {
  if (!pem) return false;
  const header = pem.match(/-----BEGIN ([A-Z ]+?)-----/);
  const footer = pem.match(/-----END ([A-Z ]+?)-----/);
  if (!header || !footer) return false;
  const h = header[1].trim();
  const f = footer[1].trim();
  const ok = (h === "PRIVATE KEY" && f === "PRIVATE KEY") ||
             (h === "RSA PRIVATE KEY" && f === "RSA PRIVATE KEY");
  return ok;
}

function keyPreview(pem) {
  if (!pem) return "none";
  const lines = pem.split("\n");
  return { first: lines[0], last: lines[lines.length - 1], length: pem.length };
}

// in handler(event):
if (p === "/diag/key" && method === "POST") {
  let body; try { body = JSON.parse(event.body||"{}"); } catch { return json({error:"bad json"},422); }
  const pem = normalizePem(body.key);
  return json({ preview: keyPreview(pem) });
}



// RSA (OAEP-SHA256)
function encryptRsa(publicPem, data) {
  const buf = Buffer.from(data, "utf8");
  const out = crypto.publicEncrypt(
    {
      key: publicPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buf
  );
  return out.toString("base64");
}
function decryptRsa(privatePem, b64) {
  const buf = Buffer.from(b64, "base64");
  const out = crypto.privateDecrypt(
    {
      key: privatePem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buf
  );
  return out.toString("utf8");
}

// --- route handlers ---
async function handleEncrypt(event) {
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return bad("Invalid JSON body", 422); }
  const key = normalizePem(body.key);
  const data = typeof body.data === "string" ? body.data : "";
  if (!key || !isPublicPem(key)) return bad("Invalid public key. Provide a PEM-formatted RSA public key.", 400);
  if (!data) return bad("Data is required", 400);

  const ciphertext = encryptRsa(key, data);

  // log
  const row = { id: uuid(), timestamp: unixSec(), ip: ipFromHeaders(event.headers || {}), data: "encrypt ok" };
  await withDb(async (c) => {
    await c.query("INSERT INTO logs (id,timestamp,ip,data) VALUES ($1,$2,$3,$4)", [row.id, row.timestamp, row.ip, row.data]);
  });

  return json({ data: ciphertext });
}

async function handleDecrypt(event) {
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return bad("Invalid JSON body", 422); }
  const key = normalizePem(body.key);
  const data = typeof body.data === "string" ? body.data : "";
  if (!key || !isPrivatePem(key)) return bad("Invalid private key. Provide a PEM-formatted RSA private key.", 400);
  if (!data) return bad("Data is required", 400);

  let plaintext;
  try { plaintext = decryptRsa(key, data); }
  catch { return bad("Ciphertext could not be decrypted with the provided private key", 400); }

  const row = { id: uuid(), timestamp: unixSec(), ip: ipFromHeaders(event.headers || {}), data: "decrypt ok" };
  await withDb(async (c) => {
    await c.query("INSERT INTO logs (id,timestamp,ip,data) VALUES ($1,$2,$3,$4)", [row.id, row.timestamp, row.ip, row.data]);
  });

  return json({ data: plaintext });
}

async function handleGetLogs(event) {
  const url = new URL(event.rawUrl);
  const size = Math.max(0, Math.min(100, parseInt(url.searchParams.get("size") || "10", 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));

  const items = await withDb(async (c) => {
    const r = await c.query("SELECT id,timestamp,ip,data FROM logs ORDER BY timestamp DESC OFFSET $1 LIMIT $2", [offset, size]);
    return r.rows;
  });
  return json({ items });
}

async function handleClearLogs() {
  await withDb(async (c) => { await c.query("TRUNCATE TABLE logs"); });
  return json({ cleared: true });
}

// --- main handler ---
export async function handler(event) {
  const p = event.path.replace("/.netlify/functions/api", "");
  const method = event.httpMethod.toUpperCase();

  // Routes
  if (p === "/api/v1/encrypt" && method === "POST") return await handleEncrypt(event);
  if (p === "/api/v1/decrypt" && method === "POST") return await handleDecrypt(event);
  if (p === "/api/v1/logs"    && method === "GET")  return await handleGetLogs(event);
  if (p === "/api/v1/logs"    && method === "DELETE") return await handleClearLogs();

  return json({ detail: "Not Found" }, 404);
}
