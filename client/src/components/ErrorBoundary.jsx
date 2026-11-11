import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            maxWidth: '600px',
            margin: '40px auto',
            padding: '24px',
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            color: '#991b1b',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#7f1d1d' }}>
            An unexpected error occurred in the user interface.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
