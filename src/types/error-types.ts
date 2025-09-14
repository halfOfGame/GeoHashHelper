/**
 * 全局错误类型定义
 * 定义应用中所有可能的错误类型和错误处理接口
 */

export enum ErrorType {
  // 输入相关错误
  INVALID_GEOHASH = 'INVALID_GEOHASH',
  DECODE_FAILED = 'DECODE_FAILED',
  COORDINATE_OUT_OF_RANGE = 'COORDINATE_OUT_OF_RANGE',
  BATCH_SIZE_EXCEEDED = 'BATCH_SIZE_EXCEEDED',
  
  // 系统相关错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  CLIPBOARD_ERROR = 'CLIPBOARD_ERROR',
  FILE_EXPORT_ERROR = 'FILE_EXPORT_ERROR',
  
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  input?: string;
  suggestions?: string[];
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userInput?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: 'retry' | 'reset' | 'navigate' | 'custom';
}

export interface ErrorDisplayProps {
  error: AppError;
  context?: ErrorContext;
  onDismiss?: () => void;
  onRetry?: () => void;
  recoveryActions?: ErrorRecoveryAction[];
}