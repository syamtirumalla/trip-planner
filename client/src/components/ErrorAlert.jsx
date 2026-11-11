import React from 'react';
import { ERROR_CODES } from '../../../shared/constants.js';

const ERROR_DESCRIPTIONS = {
  [ERROR_CODES.TIMEOUT]: 'The AI request timed out. Travel itineraries can be complex; try a slightly shorter prompt or retry now.',
  [ERROR_CODES.RATE_LIMITED]: 'We hit the AI service rate limit. Please wait 10 seconds and try again.',
  [ERROR_CODES.UPSTREAM]: 'The AI service encountered an upstream issue. Please retry in a few moments.',
  [ERROR_CODES.MALFORMED]: 'The model returned invalid JSON syntax that could not be parsed.',
  [ERROR_CODES.WRONG_SHAPE]: 'The response did not match our itinerary structure and could not be salvaged.',
  [ERROR_CODES.EMPTY]: 'No itinerary content was generated. Please expand your trip description with more details.',
};

export function ErrorAlert({ error, onRetry }) {
  if (!error) return null;

  const code = error.code || 'UPSTREAM';
  const description = ERROR_DESCRIPTIONS[code] || error.message;

  return (
    <div
      role="alert"
      style={{
        padding: '16px 20px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 'var(--radius-md)',
        color: '#991b1b',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '15px' }}>
          {code === 'TIMEOUT' ? 'Request Timed Out' : 'Failed to Generate Itinerary'}
        </strong>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 6px',
            background: '#fee2e2',
            borderRadius: '4px',
            fontWeight: '600',
            letterSpacing: '0.5px',
          }}
        >
          {code}
        </span>
      </div>

      <p style={{ fontSize: '13px', margin: 0, color: '#7f1d1d' }}>
        {description}
      </p>

      {onRetry && (
        <div>
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: '6px 14px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Retry Request
          </button>
        </div>
      )}
    </div>
  );
}
