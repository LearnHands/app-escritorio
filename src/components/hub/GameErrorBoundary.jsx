import React from 'react';
import { addLocalLog } from '../../services/sync';
import HandButton from './HandButton';

class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    try {
      const msg = error ? error.message : 'Unknown error';
      const stack = errorInfo ? errorInfo.componentStack : (error ? error.stack : '');
      addLocalLog('MODULE_CRASH', `Falla en módulo [${this.props.gameKey}]: ${msg}\nStack: ${stack}`);
    } catch (e) {
      console.error('Failed to write local log in boundary:', e);
    }
    console.error(`[GameErrorBoundary] Error caught in game ${this.props.gameKey}:`, error, errorInfo);
  }

  handleBackToMenu = () => {
    if (this.props.onGoToMenu) {
      this.props.onGoToMenu();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { lang } = this.props;
      const isEs = lang === 'es';
      const errorMsg = this.state.error ? this.state.error.message : '';
      const componentStack = this.state.errorInfo ? this.state.errorInfo.componentStack : '';

      return (
        <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-[#020208] text-white select-none">
          <div className="glass max-w-2xl w-full p-8 rounded-[40px] border border-red-500/30 bg-black/60 shadow-[0_0_60px_rgba(239,68,68,0.15)] flex flex-col items-center text-center gap-6">
            
            {/* Inline Warning/Alert Octagon SVG Icon */}
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.4em]">
                {isEs ? 'Error Detectado' : 'Error Detected'}
              </span>
              <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tight">
                {isEs ? 'Módulo Interrumpido' : 'Module Interrupted'}
              </h2>
              <p className="text-white/60 text-xs font-medium px-4 leading-relaxed">
                {isEs 
                  ? 'El juego ha experimentado una falla en tiempo de ejecución. Los detalles han sido registrados localmente para su análisis.' 
                  : 'The game has encountered a runtime exception. Details have been logged locally for analysis.'}
              </p>
            </div>

            {/* Error stack trace details box */}
            <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-left font-mono text-[10px] text-red-300/80 overflow-auto max-h-[160px] select-text">
              <p className="font-bold text-red-400 mb-1">{errorMsg}</p>
              <pre className="whitespace-pre-wrap leading-tight">{componentStack || (this.state.error && this.state.error.stack)}</pre>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 w-full justify-center mt-2 z-50">
              <HandButton 
                onClick={this.handleBackToMenu}
                className="px-8 py-3 flex items-center gap-2"
                variant="red"
                dwellMs={1000}
              >
                {/* Inline Home SVG Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span className="text-xs font-black uppercase tracking-wider">
                  {isEs ? 'Volver al Hub' : 'Back to Hub'}
                </span>
              </HandButton>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;
