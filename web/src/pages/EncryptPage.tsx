import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toMessage } from "../lib/errors";

export default function EncryptPage() {
  const [pubKey, setPubKey] = useState("");
  const [payload, setPayload] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(""), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult("");
    setLoading(true);
    try {
      // Allow pasted JSON or extra wrapper content; extract PEM block
      let cleaned = pubKey.trim();
      try {
        const maybe = JSON.parse(cleaned) as unknown;
        if (typeof maybe === "object" && maybe && "key" in maybe) {
          cleaned = String((maybe as { key: unknown }).key);
        }
      } catch { /* not JSON; ignore */ }
      const m = cleaned.match(/-----BEGIN PUBLIC KEY-----[\s\S]+?-----END PUBLIC KEY-----/);
      if (m) cleaned = m[0];

      const res = await api.encrypt({ key: cleaned, data: payload });
      setResult(res.data);
    } catch (err: unknown) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onClear = () => {
    setPubKey("");
    setPayload("");
    setResult("");
    setError("");
  };

  const onCopy = async () => {
    const { copyText } = await import("../lib/clipboard");
    const ok = await copyText(result);
    if (ok) setCopied("Encrypted text copied!");
  };

  return (
    <div className="card">
      <h1 className="title">Encrypt</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Public Key (PEM)
          <textarea
            rows={8}
            value={pubKey}
            onChange={(e) => setPubKey(e.target.value)}
            placeholder="-----BEGIN PUBLIC KEY-----"
          />
        </label>

        <label>
          Payload
          <textarea
            rows={4}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Your plaintext"
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" disabled={loading} type="submit">
            {loading ? "Encrypting…" : "Encrypt"}
          </button>
          <button type="button" className="btn secondary" onClick={onClear} disabled={loading}>
            Clear
          </button>
        </div>
      </form>

      {error && <p className="alert error">Error: {error}</p>}

      {result && (
        <div style={{ marginTop: 12 }}>
          <h3 className="title">Ciphertext (base64)</h3>
          <textarea readOnly rows={6} value={result} />
          <div className="row-actions">
            <button className="iconbtn" onClick={onCopy}>Copy</button>
            {copied && <span className="toast">{copied}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
