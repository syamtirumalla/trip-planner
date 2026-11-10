import React, { useState } from 'react';

export default function App() {
  const [prompt, setPrompt] = useState('4 days in Kyoto in April, love food and temples, mid budget');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTestPlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Server returned an error');
      }
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>AI Trip Planner (Phase 1 Harness)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Verifying Vite client, Express backend proxy, and mock itinerary pipeline.
        </p>
      </header>

      <form onSubmit={handleTestPlan} style={{ marginBottom: '24px' }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '12px',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
          }}
        >
          {loading ? 'Fetching Itinerary...' : 'Test /api/plan'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>{data.itinerary.title}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{data.itinerary.summary}</p>
          <p style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600' }}>
            ✓ Successfully received {data.itinerary.days.length} days and {data.itinerary.days.reduce((acc, d) => acc + d.stops.length, 0)} stops from /api/plan
          </p>
        </div>
      )}
    </div>
  );
}

