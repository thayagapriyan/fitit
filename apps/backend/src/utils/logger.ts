import { isDevelopment } from '../config/index.js';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Current minimum log level
 */
const currentLogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

/**
 * Structured log entry
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  data?: Record<string, unknown>;
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (isDevelopment) {
    // Pretty format for development
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      entry.correlationId ? `[${entry.correlationId}]` : '',
      entry.message,
    ].filter(Boolean);
    
    if (entry.data) {
      return `${parts.join(' ')}\n${JSON.stringify(entry.data, null, 2)}`;
    }
    return parts.join(' ');
  }
  
  // JSON format for production (better for log aggregation)
  return JSON.stringify(entry);
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

/**
 * Create a log entry
 */
function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
  correlationId?: string
): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    correlationId,
    data,
  };

  const formatted = formatLogEntry(entry);

  switch (level) {
    case LogLevel.ERROR:
      console.error(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Logger instance with convenience methods
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>, correlationId?: string) =>
    log(LogLevel.DEBUG, message, data, correlationId),
  
  info: (message: string, data?: Record<string, unknown>, correlationId?: string) =>
    log(LogLevel.INFO, message, data, correlationId),
  
  warn: (message: string, data?: Record<string, unknown>, correlationId?: string) =>
    log(LogLevel.WARN, message, data, correlationId),
  
  error: (message: string, data?: Record<string, unknown>, correlationId?: string) =>
    log(LogLevel.ERROR, message, data, correlationId),

  /**
   * Create a child logger with correlation ID
   */
  withCorrelationId: (correlationId: string) => ({
    debug: (message: string, data?: Record<string, unknown>) =>
      log(LogLevel.DEBUG, message, data, correlationId),
    info: (message: string, data?: Record<string, unknown>) =>
      log(LogLevel.INFO, message, data, correlationId),
    warn: (message: string, data?: Record<string, unknown>) =>
      log(LogLevel.WARN, message, data, correlationId),
    error: (message: string, data?: Record<string, unknown>) =>
      log(LogLevel.ERROR, message, data, correlationId),
  }),
};
