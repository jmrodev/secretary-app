import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopy = () => {
    const errorText = `${this.state.error?.toString()}\n\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary-container animate-fade-in">
            <div className="error-boundary-card">
                <div className="error-boundary-icon">
                    <Icon name="error_outline" size="4rem" color="#e74c3c" />
                </div>
                <h2>¡Ups! Algo salió mal.</h2>
                <p>Ha ocurrido un error inesperado en esta sección de la aplicación.</p>
                {process.env.NODE_ENV === 'development' && (
                    <details className="error-details">
                        <summary>Detalles del error (Solo en desarrollo)</summary>
                        <p>{this.state.error && this.state.error.toString()}</p>
                        <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                    </details>
                )}
                <div className="error-boundary-actions">
                    <Button
                        variant="primary"
                        onClick={this.handleReload}
                        icon={<Icon name="refresh" />}
                        className="error-reload-btn"
                    >
                        Recargar Página
                    </Button>
                    <Button
                        variant="secondary"
                        outline
                        onClick={this.handleCopy}
                        icon={<Icon name={this.state.copied ? "check" : "content_copy"} />}
                        className="error-copy-btn"
                    >
                        {this.state.copied ? "¡Copiado!" : "Copiar Error"}
                    </Button>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
