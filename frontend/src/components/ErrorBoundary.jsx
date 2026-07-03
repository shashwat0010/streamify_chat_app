import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 p-6 text-center" data-theme="forest">
          <div className="card bg-base-200 border border-error/30 p-8 max-w-lg shadow-xl rounded-2xl space-y-4">
            <h2 className="text-2xl font-bold text-error">Application Crash Detected</h2>
            <p className="text-sm opacity-80 leading-relaxed">
              An unexpected error occurred during rendering. This is often caused by missing configuration keys (like Clerk keys) or import mismatches.
            </p>
            <div className="bg-base-300 p-4 rounded-xl text-left text-xs font-mono overflow-auto max-h-40 text-error/90 border border-base-content/10 select-all">
              {this.state.error?.toString()}
            </div>
            <button
              className="btn btn-primary btn-sm rounded-xl px-5 mt-4"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/login";
              }}
            >
              Reset and Try Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
