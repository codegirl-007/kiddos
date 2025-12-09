import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <h1 className="text-2xl mb-4 text-primary">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-6">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-primary text-primary-foreground border-none rounded-full text-sm cursor-pointer shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}



