/** Netlify Functions API */
import { Client } from "pg";
import crypto from "node:crypto";

const JSON_HEADERS = { "content-type": "application/json" };
const json = (b, s=200) => ({ statusCode: s, headers: JSON_HEADERS, body: JSON.stringify(b) });
const bad = (m, s=400) => json({ detail: m }, s);

async function withDb(fn) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL env var not set");
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      timestamp BIGINT NOT NULL,
      ip TEXT NOT NULL,
      data TEXT NOT NULL
    );`);
    return await fn(client);
  } finally { await client.end(); }
}

const ipFrom = (h={}) => h["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
const unix = () => Math.floor(Date.now()/1000);
const uuid = () => crypto.randomUUID();
const norm = (p) => (typeof p === "string" ? p.replace(/^\uFEFF/, "").replace(/\r/g, "").trim() : null);
const isPub = (p) => p?.startsWith("-----BEGIN PUBLIC KEY-----") && p.endsWith("-----END PUBLIC KEY-----");
const isPriv = (p) => {
  if (typeof p !== "string") return false;
  return /-----BEGIN (RSA )?PRIVATE KEY-----[\s\S]+-----END (RSA )?PRIVATE KEY-----/m.test(p.trim());
};

function enc(pub, data){
  const out = crypto.publicEncrypt({key: pub, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256"}, Buffer.from(data,"utf8"));
  return out.toString("base64");
}
function dec(priv, b64){
  const out = crypto.privateDecrypt({key: priv, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256"}, Buffer.from(b64,"base64"));
  return out.toString("utf8");
}

async function doEncrypt(event){
  let body; try { body = JSON.parse(event.body||"{}"); } catch { return bad("Invalid JSON body", 422); }
  const key = norm(body.key); const data = typeof body.data==="string" ? body.data : "";
  if (!isPub(key)) return bad("Invalid public key. Provide a PEM-formatted RSA public key.", 400);
  if (!data) return bad("Data is required", 400);
  const ciphertext = enc(key, data);
  const row = { id: uuid(), timestamp: unix(), ip: ipFrom(event.headers||{}), data: "encrypt ok" };
  await withDb(c => c.query("INSERT INTO logs (id,timestamp,ip,data) VALUES ($1,$2,$3,$4)", [row.id,row.timestamp,row.ip,row.data]));
  return json({ data: ciphertext });
}
async function doDecrypt(event){
  let body; try { body = JSON.parse(event.body||"{}"); } catch { return bad("Invalid JSON body", 422); }
  const key = norm(body.key); const data = typeof body.data==="string" ? body.data : "";
  if (!isPriv(key)) return bad("Invalid private key. Provide a PEM-formatted RSA private key.", 400);
  if (!data) return bad("Data is required", 400);
  let plaintext; try { plaintext = dec(key, data); } catch { return bad("Ciphertext could not be decrypted with the provided private key", 400); }
  const row = { id: uuid(), timestamp: unix(), ip: ipFrom(event.headers||{}), data: "decrypt ok" };
  await withDb(c => c.query("INSERT INTO logs (id,timestamp,ip,data) VALUES ($1,$2,$3,$4)", [row.id,row.timestamp,row.ip,row.data]));
  return json({ data: plaintext });
}
async function doGetLogs(event){
  const url = new URL(event.rawUrl);
  const size = Math.max(0, Math.min(100, parseInt(url.searchParams.get("size")||"10",10)));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset")||"0",10));
  const items = await withDb(async c => (await c.query("SELECT id,timestamp,ip,data FROM logs ORDER BY timestamp DESC OFFSET $1 LIMIT $2",[offset,size])).rows);
  return json({ items });
}
async function doClear(){ await withDb(c=>c.query("TRUNCATE TABLE logs")); return json({ cleared: true }); }

export async function handler(event){
  const p = event.path.replace("/.netlify/functions/api",""); const m = event.httpMethod.toUpperCase();
  if (p==="/health" && m==="GET") return json({ status:"ok" });
  if (p==="/api/v1/encrypt" && m==="POST") return await doEncrypt(event);
  if (p==="/api/v1/decrypt" && m==="POST") return await doDecrypt(event);
  if (p==="/api/v1/logs" && m==="GET") return await doGetLogs(event);
  if (p==="/api/v1/logs" && m==="DELETE") return await doClear();
  return json({ detail:"Not Found" }, 404);
}
