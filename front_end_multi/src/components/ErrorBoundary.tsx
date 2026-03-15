import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
            <h2 className="font-semibold text-red-800">Erro ao carregar</h2>
            <pre className="mt-2 text-sm text-red-700 overflow-auto max-h-60">
              {this.state.error.message}
            </pre>
            <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
              {this.state.error.stack}
            </pre>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
