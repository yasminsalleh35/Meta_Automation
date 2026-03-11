import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class MetaAssetsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MetaAssetsErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-destructive mb-1">
                  Erro ao carregar ativos Meta
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ocorreu um erro inesperado ao tentar carregar seus ativos do Meta Ads.
                </p>
              </div>

              {this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Detalhes técnicos
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md font-mono text-xs overflow-auto">
                    <div className="mb-2 text-destructive font-semibold">
                      {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <pre className="text-muted-foreground whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Recarregar Página
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
