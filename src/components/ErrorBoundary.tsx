import React, { Component } from 'react';
import type { ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Global error boundary that catches rendering errors and displays
 * a Windows 98 styled error dialog instead of crashing the whole app.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="window" style={{ maxWidth: 400, margin: '48px auto' }}>
          <div className="title-bar">
            <div className="title-bar-text">⚠ Application Error</div>
          </div>
          <div className="window-body" style={{ padding: '16px' }}>
            <p style={{ marginBottom: '12px' }}>
              An unexpected error occurred. Please click Retry to continue.
            </p>
            <pre
              style={{
                background: '#fff',
                border: '1px inset #888',
                padding: '8px',
                fontSize: '0.75rem',
                overflowX: 'auto',
                marginBottom: '12px',
              }}
            >
              {this.state.errorMessage}
            </pre>
            <button onClick={this.handleReset}>Retry</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
