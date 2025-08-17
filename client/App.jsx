import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  importAesGcmKeyFromBase64,
  encryptJsonGcm,
  decryptJsonGcm,
} from './crypto';
import './App.css'; 

const API = '/api/compute';

const App = () => {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [operation, setOperation] = useState('add');
  const [result, setResult] = useState(null);
  const [rawPayload, setRawPayload] = useState(null);
  const [key, setKey] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPayload, setShowPayload] = useState(false);


  // Load AES-GCM key from base64 env variable
  useEffect(() => {
    const b64 = import.meta.env.VITE_AES_KEY_B64;
    if (!b64) {
      setErr('missing VITE_AES_KEY_B64 ב-client/.env.local');
      return;
    }
    importAesGcmKeyFromBase64(b64)
      .then(setKey)
      .catch(e => setErr(`Key import failed: ${e.message || e}`));
  }, []);



  const handleSubmit = async () => {
    try {
      setErr('');
      setResult(null);
      setRawPayload(null);

      if (!key) throw new Error('Encryption key not loaded');

      const aNum = Number(a), bNum = Number(b);
      if (!Number.isFinite(aNum) || !Number.isFinite(bNum)) {
        throw new Error(' Both inputs must be valid numbers');
      }

      setBusy(true);

      // Encrypt request
      const encReq = await encryptJsonGcm({ op: operation, a: aNum, b: bNum }, key);

      // Send to server
      const res = await axios.post(API, { payload: encReq }, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Decrypt response
      const encRes = res.data?.payload;
      setRawPayload(encRes);
      const plain = await decryptJsonGcm(encRes, key);
      setResult(plain.result);
    } catch (e) {
      console.error(e);
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const opLabel = (v) =>
    v === 'add' ? 'Add' : v === 'mul' ? 'Multiply' : 'Average';

  return (
    <div className="bg">
      <header className="nav">
        <div className="brand">
          <span className="logo-dot" />
          <span className="brand-text">FHE Playground</span>
        </div>
        <div className="badge">Simulation • AES-GCM</div>
      </header>

      <main className="container">
        <section className="card glass">
          <h1 className="title">
            Compute on <span className="grad">Encrypted</span> Data
          </h1>
          <p className="subtitle">
          Encrypt → Send → Compute on server side → Receive encrypted result → Decrypt. The demo simulates the idea of FHE with AES-GCM.          </p>

          <div className="grid">
            <label className="field">
              <span>First number</span>
              <input
                className="input"
                type="number"
                value={a}
                onChange={(e) => setA(e.target.value)}
                placeholder="e.g. 10"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </label>

            <label className="field">
              <span>Second number</span>
              <input
                className="input"
                type="number"
                value={b}
                onChange={(e) => setB(e.target.value)}
                placeholder="e.g. 50"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </label>

            <div className="field">
              <span>Operation</span>
              <div className="segmented">
                {['add', 'mul', 'avg'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    className={`seg-btn ${operation === op ? 'active' : ''}`}
                    onClick={() => setOperation(op)}
                  >
                    {opLabel(op)}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!key || busy}
            >
              {busy ? 'Computing…' : 'Compute (Encrypted)'}
            </button>
          </div>

          {err && <div className="alert error">{err}</div>}

          {result !== null && (
            <div className="result glass-lite">
              <div className="result-label">Decrypted Result</div>
              <div className="result-value">{String(result)}</div>
            </div>
          )}

          <div className="payload-toggle">
            <button
              className="btn-ghost"
              onClick={() => setShowPayload((v) => !v)}
            >
              {showPayload ? 'Hide' : 'Show'} Encrypted Payload
            </button>
          </div>

          {showPayload && rawPayload && (
            <pre className="code-block">
          {JSON.stringify(rawPayload, null, 2)}
            </pre>
          )}
        </section>

        <footer className="footer">
          <span>Built with Flask + Web Crypto • Dark Tech Theme</span>
        </footer>
      </main>
    </div>
  );
};

export default App;
