// ════════════════════════════════════════════
// Error Handling & Logging — Centralized error management
// ════════════════════════════════════════════

export enum ErrorCode {
  // Authentication
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Resources
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",

  // Server
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",

  // Business logic
  WORKSPACE_LIMIT_REACHED = "WORKSPACE_LIMIT_REACHED",
  ROLE_IN_USE = "ROLE_IN_USE",
  STAGE_NOT_EMPTY = "STAGE_NOT_EMPTY",
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 500,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      metadata: this.metadata,
    };
  }
}

/**
 * Log levels for structured logging
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export type LogContext = {
  userId?: string;
  workspaceId?: string;
  orgId?: string;
  requestId?: string;
  [key: string]: unknown;
};

/**
 * Structured logger
 */
class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In production, you'd send this to a logging service
    // (e.g., Datadog, Sentry, CloudWatch)
    if (this.isDev) {
      console.log(JSON.stringify(logData, null, 2));
    } else {
      console.log(JSON.stringify(logData));
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | AppError, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error instanceof AppError ? { code: error.code } : {}),
          }
        : undefined,
    };
    this.log(LogLevel.ERROR, message, errorContext);
  }
}

export const logger = new Logger();

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown, context?: LogContext): {
  message: string;
  status: number;
  code?: string;
} {
  if (error instanceof AppError) {
    logger.error(error.message, error, context);
    return {
      message: error.message,
      status: error.status,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    logger.error("Unexpected error", error, context);
    return {
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred",
      status: 500,
    };
  }

  logger.error("Unknown error", undefined, { ...context, error });
  return {
    message: "An unexpected error occurred",
    status: 500,
  };
}

/**
 * Create common errors
 */
export const errors = {
  unauthorized: (message = "Unauthorized") =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message = "Forbidden") =>
    new AppError(ErrorCode.FORBIDDEN, message, 403),

  notFound: (resource: string) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404),

  validation: (message: string, metadata?: Record<string, unknown>) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, metadata),

  alreadyExists: (resource: string) =>
    new AppError(
      ErrorCode.ALREADY_EXISTS,
      `${resource} already exists`,
      409
    ),

  internalError: (message = "Internal server error") =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500),

  databaseError: (message = "Database operation failed") =>
    new AppError(ErrorCode.DATABASE_ERROR, message, 500),
};
