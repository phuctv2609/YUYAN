import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('YUYAN ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background-canvas flex items-center justify-center p-6 text-center">
          <div className="bg-surface p-8 rounded-3xl border border-border-subtle shadow-lg max-w-md w-full">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Đã có lỗi xảy ra</h2>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              Ứng dụng vừa gặp phải một sự cố ngoài ý muốn. Dữ liệu học tập của bạn vẫn an toàn trong hệ thống.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tải lại trang</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-surface-secondary text-text-secondary text-xs font-bold rounded-xl hover:bg-border-subtle flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
