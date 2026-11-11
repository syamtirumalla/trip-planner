import React, { useState } from 'react';
import { ExamplePrompts } from './ExamplePrompts.jsx';
import { PROMPT_LIMITS } from '../../../shared/constants.js';

export function PromptForm({ onSubmit, onCancel, status }) {
  const [prompt, setPrompt] = useState('4 days in Kyoto in April, love food and temples, mid budget');
  const isLoading = status === 'loading';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt);
  };

  const handleKeyDown = (e) => {
    // Submit on Cmd+Enter / Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
      }}
    >
      <label
        htmlFor="trip-prompt-input"
        style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '15px' }}
      >
        Describe your trip
      </label>

      <div style={{ position: 'relative' }}>
        <textarea
          id="trip-prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, PROMPT_LIMITS.MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={3}
          placeholder="e.g. 4 days in Kyoto in April, love food and temples, mid budget"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <span
          style={{
            display: 'block',
            textAlign: 'right',
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}
        >
          {prompt.length} / {PROMPT_LIMITS.MAX_LENGTH} characters
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={isLoading || prompt.trim().length < PROMPT_LIMITS.MIN_LENGTH}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading || prompt.trim().length < PROMPT_LIMITS.MIN_LENGTH ? 0.6 : 1,
            transition: 'opacity var(--transition)',
          }}
        >
          {isLoading ? 'Planning Trip...' : 'Plan Trip'}
        </button>

        {isLoading && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>

      <ExamplePrompts onSelectPrompt={(text) => setPrompt(text)} disabled={isLoading} />
    </form>
  );
}
