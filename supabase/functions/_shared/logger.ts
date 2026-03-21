// Phase 7.1 — Structured logger for all edge functions
// Consistent log format: [ISO][function][STAGE] message {data}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  function_name: string;
  level: LogLevel;
  stage: string;
  message: string;
  data?: Record<string, unknown>;
  duration_ms?: number;
}

export function createLogger(functionName: string) {
  const startTime = Date.now();

  function log(level: LogLevel, stage: string, message: string, data?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][${functionName}][${stage.toUpperCase()}]`;
    const elapsed = Date.now() - startTime;

    const entry: LogEntry = {
      timestamp,
      function_name: functionName,
      level,
      stage,
      message,
      data,
      duration_ms: elapsed,
    };

    // Structured JSON for Supabase log drain / Logflare
    const structured = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
        break;
      default:
        console.log(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
    }

    return entry;
  }

  return {
    info: (stage: string, message: string, data?: Record<string, unknown>) =>
      log('info', stage, message, data),
    warn: (stage: string, message: string, data?: Record<string, unknown>) =>
      log('warn', stage, message, data),
    error: (stage: string, message: string, data?: Record<string, unknown>) =>
      log('error', stage, message, data),
    debug: (stage: string, message: string, data?: Record<string, unknown>) =>
      log('debug', stage, message, data),
    elapsed: () => Date.now() - startTime,
  };
}
