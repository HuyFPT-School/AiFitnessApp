import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-canvas)] p-6 text-center">
          <div className="card-impeccable max-w-md w-full p-8 flex flex-col items-center space-y-4 shadow-xl border border-[var(--border-card)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
              Đã Xảy Ra Sự Cố
            </h2>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Trang web gặp trục trặc khi kết nối hoặc render dữ liệu. Vui lòng bấm nút bên dưới để khởi động lại.
            </p>

            {this.state.error?.message && (
              <pre className="w-full rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-3 text-[11px] font-mono text-rose-500 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="btn-kinpaku flex items-center space-x-2 px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer mt-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>TẢI LẠI TRANG</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
