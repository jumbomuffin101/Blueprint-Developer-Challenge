import { Link, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import { api } from "./lib/api"
import "./styles.css"

export default function App() {
  const [health, setHealth] = useState<"checking"|"ok"|"down">("checking")
  useEffect(() => { api.health().then(()=>setHealth("ok")).catch(()=>setHealth("down")) }, [])
  return (
    <>
      <nav>
        <Link to="/">Encrypt</Link>
        <Link to="/decrypt">Decrypt</Link>
        <Link to="/logs">Logs</Link>
        <span className="spacer">API: {health==="checking"?"checking…":health}</span>
      </nav>
      <div style={{padding:12}}>
        <Outlet />
      </div>
    </>
  )
}
