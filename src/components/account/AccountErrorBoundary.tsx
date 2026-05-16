'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AccountErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl border border-paper-outline bg-error-container p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-error" />
            <h2 suppressHydrationWarning className="text-lg font-semibold text-error">
              Error inesperado
            </h2>
          </div>
          <p className="text-sm text-ink-muted">
            Ocurrió un error al renderizar esta sección. Por favor, recargá la página para intentar de nuevo.
          </p>
          {this.state.error && (
            <details className="text-xs text-ink-faint">
              <summary className="cursor-pointer">Detalles técnicos</summary>
              <pre className="mt-1 p-2 rounded bg-paper-container overflow-x-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-error text-white hover:opacity-90 transition-opacity"
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
