import { useState } from 'react'
import { api } from '../lib/api'

export default function DecryptPage() {
  const [privKey, setPrivKey] = useState('')
  const [cipher, setCipher] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setResult(''); setLoading(true)
    try {
      const res = await api.decrypt({ key: privKey, data: cipher })
      setResult(res.data)
    } catch (err:any) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth: 900, margin: '24px auto', padding: 16}}>
      <h1>Decrypt</h1>
      <form onSubmit={onSubmit} style={{display:'grid', gap: 12}}>
        <label>
          Private Key (PEM)
          <textarea value={privKey} onChange={e=>setPrivKey(e.target.value)} rows={10} style={{width:'100%'}} placeholder="-----BEGIN RSA PRIVATE KEY-----"/>
        </label>
        <label>
          Ciphertext (base64)
          <textarea value={cipher} onChange={e=>setCipher(e.target.value)} rows={6} style={{width:'100%'}} placeholder="base64 ciphertext from Encrypt"/>
        </label>
        <button disabled={loading} type="submit">{loading ? 'Decrypting…' : 'Decrypt'}</button>
      </form>
      {error && <p style={{color:'crimson', marginTop:12}}>Error: {error}</p>}
      {result && (
        <div style={{marginTop:12}}>
          <h3>Plaintext</h3>
          <textarea readOnly rows={4} style={{width:'100%'}} value={result}/>
        </div>
      )}
    </div>
  )
}
