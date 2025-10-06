import { useState } from "react";
import { api } from "../lib/api";

export default function EncryptPage() {
  const [pubKey, setPubKey] = useState("");
  const [payload, setPayload] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setResult(""); setLoading(true);
    try {
      let cleaned = pubKey.trim();
      try { const maybe = JSON.parse(cleaned); if (maybe?.key) cleaned = String(maybe.key); } catch {}
      const m = cleaned.match(/-----BEGIN PUBLIC KEY-----[\s\S]+?-----END PUBLIC KEY-----/);
      if (m) cleaned = m[0];
      const res = await api.encrypt({ key: cleaned, data: payload });
      setResult(res.data);
    } catch (err:any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="title">Encrypt</h1>
      <form onSubmit={onSubmit} style={{display:"grid", gap:12}}>
        <label>Public Key (PEM)
          <textarea rows={8} value={pubKey} onChange={e=>setPubKey(e.target.value)} placeholder="-----BEGIN PUBLIC KEY-----"/>
        </label>
        <label>Payload
          <textarea rows={4} value={payload} onChange={e=>setPayload(e.target.value)} placeholder="Your plaintext"/>
        </label>
        <div style={{display:"flex", gap:8}}>
          <button className="btn" disabled={loading} type="submit">{loading?"Encrypting…":"Encrypt"}</button>
          <button type="button" className="btn secondary" onClick={()=>{setPubKey(""); setPayload(""); setResult(""); setError("");}}>Clear</button>
        </div>
      </form>
      {error && <p className="alert error">Error: {error}</p>}
      {result && (
        <div style={{marginTop:12}}>
          <h3 className="title">Ciphertext (base64)</h3>
          <textarea readOnly rows={6} value={result}/>
        </div>
      )}
    </div>
  );
}
