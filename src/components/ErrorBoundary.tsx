'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleCopyError = () => {
    const { error } = this.state;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traceId = (error as any)?.traceId || (error as any)?.trace_id;
    const details = [
      `Error: ${error?.message || 'Unknown'}`,
      `Name: ${error?.name || 'N/A'}`,
      traceId ? `Trace ID: ${traceId}` : null,
      error?.stack ? `\nStack:\n${error.stack}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(details).catch(() => {
      // Fallback: clipboard API may be unavailable
    });
  };

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const traceId = (error as any)?.traceId || (error as any)?.trace_id;

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Algo salió mal</h2>
            <p className="text-neutral-500 text-sm mb-2">
              Ocurrió un error inesperado. Por favor, intentá recargar la página.
            </p>
            {traceId && (
              <p className="text-xs text-neutral-400 font-mono mb-4 bg-neutral-50 py-1.5 px-3 rounded-md inline-block">
                trace_id: {traceId}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleCopyError}
                className="px-5 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors text-sm"
              >
                Copiar error
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 bg-[#c54141] text-white font-medium rounded-lg hover:bg-[#a03535] transition-colors text-sm"
              >
                Recargar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
