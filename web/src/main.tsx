import React from 'react'
import './styles.css'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import EncryptPage from './pages/EncryptPage'
import DecryptPage from './pages/DecryptPage'
import LogsPage from './pages/LogsPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <EncryptPage /> },
      { path: 'decrypt', element: <DecryptPage /> },
      { path: 'logs', element: <LogsPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
