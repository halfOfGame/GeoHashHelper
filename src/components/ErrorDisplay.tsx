/**
 * 错误显示组件
 * 提供友好的错误信息显示和恢复操作
 */

'use client';

import React from 'react';
import { AppError, ErrorSeverity, ErrorRecoveryAction } from '../types/error-types';

interface ErrorDisplayProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void;
  recoveryActions?: ErrorRecoveryAction[];
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  onRetry,
  recoveryActions,
  className = ''
}) => {
  const getSeverityStyles = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
        };
      
      case ErrorSeverity.MEDIUM:
        return {
          container: 'bg-orange-50 border-orange-200 text-orange-800',
          icon: 'text-orange-600',
          iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        };
      
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        };
      
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'text-gray-600',
          iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        };
    }
  };

  const styles = getSeverityStyles(error.severity);

  const handleRecoveryAction = async (action: ErrorRecoveryAction) => {
    try {
      await action.action();
    } catch (err) {
      console.error('Recovery action failed:', err);
    }
  };

  return (
    <div className={`rounded-md border p-4 ${styles.container} ${className}`}>
      <div className="flex">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <svg 
            className={`h-5 w-5 ${styles.icon}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={styles.iconPath} 
            />
          </svg>
        </div>

        <div className="ml-3 flex-1">
          {/* Error Message */}
          <h3 className="text-sm font-medium">
            {error.message}
          </h3>

          {/* Error Details */}
          {error.details && (
            <div className="mt-2 text-sm opacity-90">
              <p>{error.details}</p>
            </div>
          )}

          {/* Input Context */}
          {error.input && (
            <div className="mt-2 text-sm opacity-75">
              <span className="font-medium">输入内容:</span> {error.input}
            </div>
          )}

          {/* Suggestions */}
          {error.suggestions && error.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">建议解决方案:</p>
              <ul className="text-sm space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-current rounded-full mt-2 mr-2 flex-shrink-0 opacity-60"></span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* Retry Button */}
            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重试
              </button>
            )}

            {/* Recovery Actions */}
            {recoveryActions?.map((action, index) => (
              <button
                key={index}
                onClick={() => handleRecoveryAction(action)}
                className="inline-flex items-center px-3 py-1.5 border border-current text-xs font-medium rounded-md hover:bg-current hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-colors"
              >
                {action.label}
              </button>
            ))}

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-current text-xs font-medium rounded-md hover:bg-current hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                关闭
              </button>
            )}
          </div>

          {/* Timestamp */}
          <div className="mt-3 text-xs opacity-60">
            发生时间: {error.timestamp.toLocaleString('zh-CN')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;