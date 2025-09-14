/**
 * 错误边界组件
 * 捕获React组件树中的JavaScript错误，并显示友好的错误界面
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { AppError, ErrorType, ErrorSeverity } from '../types/error-types';
import { ErrorHandler } from '../lib/error-handler';
import ErrorDisplay from './ErrorDisplay';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 创建应用错误对象
    const appError = ErrorHandler.createError(
      ErrorType.UNKNOWN_ERROR,
      '应用发生未预期的错误',
      {
        component: 'ErrorBoundary',
        action: 'render'
      },
      {
        severity: ErrorSeverity.HIGH,
        details: error.message,
        suggestions: [
          '刷新页面重试',
          '清除浏览器缓存',
          '检查网络连接',
          '如果问题持续存在，请联系技术支持'
        ],
        recoverable: true,
        retryable: true
      }
    );

    return {
      hasError: true,
      error: appError,
      errorInfo: error.stack || null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误详细信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 调用错误回调
    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error);
    }
  }

  handleRetry = () => {
    // 重置错误状态，重新渲染组件
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    // 刷新页面
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否则显示默认错误界面
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 mb-2">
                应用遇到了问题
              </h1>
              <p className="text-sm text-gray-600">
                很抱歉，应用发生了意外错误。请尝试以下解决方案。
              </p>
            </div>

            <ErrorDisplay
              error={this.state.error}
              onRetry={this.handleRetry}
              recoveryActions={[
                {
                  label: '刷新页面',
                  action: this.handleReload,
                  type: 'retry'
                }
              ]}
              className="mb-6"
            />

            {/* 开发环境下显示错误详情 */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 p-4 bg-gray-100 rounded-md">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  错误详情 (开发模式)
                </summary>
                <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                  {this.state.errorInfo}
                </pre>
              </details>
            )}

            {/* 返回首页按钮 */}
            <div className="text-center mt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                返回首页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;