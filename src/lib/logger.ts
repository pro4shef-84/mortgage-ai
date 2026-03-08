// ============================================================
// STRUCTURED LOGGER
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  [key: string]: unknown
}

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }
}

function output(entry: LogEntry): void {
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    const color = {
      debug: '\x1b[37m',
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
    }[entry.level]
    const reset = '\x1b[0m'
    console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} — ${entry.message}`,
      Object.keys(entry).filter(k => !['level', 'message', 'timestamp'].includes(k)).length > 0
        ? entry
        : ''
    )
  } else {
    // Production: JSON structured logs for log aggregators
    const fn = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.log
    fn(JSON.stringify(entry))
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    output(formatEntry('debug', message, meta)),
  info: (message: string, meta?: Record<string, unknown>) =>
    output(formatEntry('info', message, meta)),
  warn: (message: string, meta?: Record<string, unknown>) =>
    output(formatEntry('warn', message, meta)),
  error: (message: string, meta?: Record<string, unknown>) =>
    output(formatEntry('error', message, meta)),
}
