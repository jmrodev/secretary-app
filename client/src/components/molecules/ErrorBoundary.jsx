import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { LanguageContext } from '@/context/LanguageContext';
import sharedStyles from '@/styles/shared.module.css';
import styles from './ErrorBoundary.module.css';

export class ErrorBoundary extends React.Component {
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
      return (
        <LanguageContext.Consumer>
          {({ t = (k) => k } = {}) => (
            <div className={`${styles.ErrorBoundary__errorBoundaryContainer} ${sharedStyles.AnimateFadeIn}`}>
                <div className={`${styles.ErrorBoundary__errorBoundaryCard}`}>
                    <div className={`${styles.ErrorBoundary__errorBoundaryIcon}`}>
                        <Icon name="error_outline" size="4rem" color="#e74c3c" />
                    </div>
                    <h2>{t('error_boundary_title')}</h2>
                    <p>{t('error_boundary_desc')}</p>
                    {process.env.NODE_ENV === 'development' && (
                        <details className={`${styles.ErrorBoundary__errorDetails}`}>
                            <summary>{t('error_boundary_details')}</summary>
                            <p>{this.state.error && this.state.error.toString()}</p>
                            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                        </details>
                    )}
                    <div className={`${styles.ErrorBoundary__errorBoundaryActions}`}>
                        <Button
                            variant="primary"
                            onClick={this.handleReload}
                            icon={<Icon name="refresh" />}
                            className={`${styles.ErrorBoundary__errorReloadBtn}`}
                        >
                            {t('reload_page')}
                        </Button>
                        <Button
                            variant="secondary"
                            outline
                            onClick={this.handleCopy}
                            icon={<Icon name={this.state.copied ? "check" : "content_copy"} />}
                            className={`${styles.ErrorBoundary__errorCopyBtn}`}
                        >
                            {this.state.copied ? t('copied') : t('copy_error')}
                        </Button>
                    </div>
                </div>
            </div>
          )}
        </LanguageContext.Consumer>
      );
    }

    return this.props.children;
  }
}
