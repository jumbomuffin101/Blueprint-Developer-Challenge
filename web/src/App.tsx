import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./lib/api";
import "./styles.css";

export default function App() {
  const [health, setHealth] = useState<"checking" | "ok" | "down">("checking");

  // poll the API every 10s
  useEffect(() => {
    let stopped = false;
    const ping = async () => {
      try {
        await api.health();
        if (!stopped) setHealth("ok");
      } catch {
        if (!stopped) setHealth("down");
      }
    };
    ping();
    const t = setInterval(ping, 10000);
    return () => { stopped = true; clearInterval(t); };
  }, []);

   const statusIcon =
    health === "ok" ? (
      <span className="status ok" title="API: OK" aria-label="API OK">✓</span>
    ) : health === "down" ? (
      <span className="status down" title="API: Down" aria-label="API Down">✗</span>
    ) : (
      <span className="status checking" title="API: Checking…" aria-label="API Checking">…</span>
    );

  return (
    <>
      <nav className="nav">
        <div className="nav-left">
          <NavLink to="/" end className={({isActive}) => "navlink" + (isActive ? " active" : "")}>Encrypt</NavLink>
          <NavLink to="/decrypt" className={({isActive}) => "navlink" + (isActive ? " active" : "")}>Decrypt</NavLink>
          <NavLink to="/logs" className={({isActive}) => "navlink" + (isActive ? " active" : "")}>Logs</NavLink>
        </div>
        <div className="nav-right">
          <span className="status-label">API</span>
          {statusIcon}
        </div>
      </nav>
      <div style={{ padding: 12 }}>
        <Outlet />
      </div>
    </>
  );
}
