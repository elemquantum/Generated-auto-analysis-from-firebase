// src/app/components/AnalysisClient.tsx
'use client';
import { useState } from 'react';

export default function AnalysisClient() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);

  const run = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, useSearch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      setResult(json.text || JSON.stringify(json));
    } catch (e) {
      setResult('Error: ' + String(e));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <h2>Auto-analysis</h2>
      <textarea rows={8} style={{ width: '100%' }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <label style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={useSearch} onChange={(e)=>setUseSearch(e.target.checked)} /> augment with web search (SerpApi)
        </label>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={run} disabled={loading || !prompt}>Run analysis</button>
      </div>
      <pre style={{ background: '#f7f7f7', padding: 12, marginTop: 12 }}>{loading ? 'Running…' : result}</pre>
    </div>
  );
}
