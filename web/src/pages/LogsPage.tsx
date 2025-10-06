import { useEffect, useState } from "react";
import { api } from "../lib/api";

type LogItem = { id: string; timestamp: number; ip: string; data: string };

export default function LogsPage() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [size, setSize] = useState(10);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = async () => {
    setLoading(true); setError(""); setOk("");
    try {
      const res = await api.logs(size, offset);
      setItems(res.items);
    } catch (err:any) {
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const onClear = async () => {
    if (!confirm("Clear ALL logs? This cannot be undone.")) return;
    setLoading(true); setError(""); setOk("");
    try {
      await api.clearLogs();
      setOk("Logs cleared.");
      setItems([]);
      setOffset(0);
    } catch (err:any) {
      setError(err.message || "Failed to clear logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load() }, [size, offset]);

  return (
    <div className="card">
      <h1 className="title">Logs</h1>

      <div className="controls">
        <label>Size <input type="number" value={size} min={1} max={100} onChange={e=>setSize(Number(e.target.value)||10)} /></label>
        <label>Offset <input type="number" value={offset} min={0} onChange={e=>setOffset(Number(e.target.value)||0)} /></label>
        <button className="btn" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
        <button className="btn danger" onClick={onClear} disabled={loading}>Clear Logs</button>
      </div>

      {error && <p className="alert error">Error: {error}</p>}
      {ok && <p className="alert ok">{ok}</p>}

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr><th>Timestamp</th><th>IP</th><th>Data</th><th>ID</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && <tr><td colSpan={4}>No logs</td></tr>}
            {items.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.timestamp * 1000).toLocaleString()}</td>
                <td>{r.ip}</td>
                <td>{r.data}</td>
                <td className="mono">{r.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
