/**
 * 全局错误处理器
 * 提供统一的错误处理、格式化和恢复机制
 */

import { AppError, ErrorType, ErrorSeverity, ErrorContext } from '../types/error-types';

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 100;

  /**
   * 创建应用错误对象
   */
  static createError(
    type: ErrorType,
    message: string,
    context?: ErrorContext,
    options?: {
      severity?: ErrorSeverity;
      details?: string;
      suggestions?: string[];
      recoverable?: boolean;
      retryable?: boolean;
    }
  ): AppError {
    const error: AppError = {
      type,
      severity: options?.severity || this.getDefaultSeverity(type),
      message,
      details: options?.details,
      input: context?.userInput,
      suggestions: options?.suggestions || this.getDefaultSuggestions(type),
      timestamp: new Date(),
      recoverable: options?.recoverable ?? this.isRecoverable(type),
      retryable: options?.retryable ?? this.isRetryable(type)
    };

    // 记录错误日志
    this.logError(error, context);

    return error;
  }

  /**
   * 处理转换相关错误
   */
  static handleConversionError(
    type: ErrorType,
    input: string,
    details?: string
  ): AppError {
    const context: ErrorContext = {
      component: 'ConversionEngine',
      action: 'convert',
      userInput: input
    };

    let message: string;
    let suggestions: string[];

    switch (type) {
      case ErrorType.INVALID_GEOHASH:
        message = `无效的GeoHash格式: "${input}"`;
        suggestions = [
          '确保GeoHash只包含有效字符: 0-9, b-z (除了a, i, l, o)',
          '检查GeoHash长度是否在1-12位之间',
          '示例有效GeoHash: wx4g0ec1, 9q9hvu, u4pruydq'
        ];
        break;

      case ErrorType.DECODE_FAILED:
        message = `GeoHash解码失败: "${input}"`;
        suggestions = [
          '检查GeoHash是否完整',
          '确认GeoHash来源是否可靠',
          '尝试使用较短的GeoHash前缀'
        ];
        break;

      case ErrorType.COORDINATE_OUT_OF_RANGE:
        message = `坐标超出有效范围: "${input}"`;
        suggestions = [
          '经度应在-180到180度之间',
          '纬度应在-90到90度之间',
          '检查原始坐标系类型是否正确'
        ];
        break;

      default:
        message = `转换过程中发生错误: "${input}"`;
        suggestions = [
          '请检查输入格式',
          '如果问题持续存在，请联系技术支持'
        ];
    }

    return this.createError(type, message, context, {
      details,
      suggestions,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: type !== ErrorType.INVALID_GEOHASH
    });
  }

  /**
   * 处理系统相关错误
   */
  static handleSystemError(
    type: ErrorType,
    originalError?: Error,
    context?: ErrorContext
  ): AppError {
    let message: string;
    let suggestions: string[];
    let severity: ErrorSeverity;

    switch (type) {
      case ErrorType.CLIPBOARD_ERROR:
        message = '复制到剪贴板失败';
        suggestions = [
          '请手动选择文本进行复制',
          '检查浏览器是否允许剪贴板访问',
          '尝试使用Ctrl+C快捷键'
        ];
        severity = ErrorSeverity.LOW;
        break;

      case ErrorType.FILE_EXPORT_ERROR:
        message = '文件导出失败';
        suggestions = [
          '检查浏览器下载设置',
          '确保有足够的磁盘空间',
          '尝试减少导出数据量'
        ];
        severity = ErrorSeverity.MEDIUM;
        break;

      case ErrorType.NETWORK_ERROR:
        message = '网络连接错误';
        suggestions = [
          '检查网络连接',
          '刷新页面重试',
          '稍后再试'
        ];
        severity = ErrorSeverity.HIGH;
        break;

      default:
        message = '系统发生未知错误';
        suggestions = [
          '刷新页面重试',
          '清除浏览器缓存',
          '如果问题持续存在，请联系技术支持'
        ];
        severity = ErrorSeverity.HIGH;
    }

    return this.createError(type, message, context, {
      details: originalError?.message,
      suggestions,
      severity,
      recoverable: true,
      retryable: true
    });
  }

  /**
   * 处理批量处理错误
   */
  static handleBatchError(
    errorCount: number,
    totalCount: number,
    sampleErrors: AppError[]
  ): AppError {
    const errorRate = (errorCount / totalCount) * 100;
    let severity: ErrorSeverity;
    let message: string;

    if (errorRate > 50) {
      severity = ErrorSeverity.HIGH;
      message = `批量处理失败率过高 (${errorRate.toFixed(1)}%)`;
    } else if (errorRate > 20) {
      severity = ErrorSeverity.MEDIUM;
      message = `批量处理部分失败 (${errorCount}/${totalCount} 失败)`;
    } else {
      severity = ErrorSeverity.LOW;
      message = `批量处理完成，少量失败 (${errorCount}/${totalCount} 失败)`;
    }

    const suggestions = [
      '检查失败项目的输入格式',
      '尝试单独处理失败的项目',
      '参考错误详情进行修正'
    ];

    // 添加常见错误类型的建议
    const errorTypes = sampleErrors.map(e => e.type);
    if (errorTypes.includes(ErrorType.INVALID_GEOHASH)) {
      suggestions.unshift('检查GeoHash格式是否正确');
    }

    return this.createError(ErrorType.VALIDATION_ERROR, message, {
      component: 'BatchProcessor',
      action: 'processBatch',
      additionalData: { errorCount, totalCount, errorRate }
    }, {
      severity,
      suggestions,
      recoverable: true,
      retryable: true
    });
  }

  /**
   * 获取错误的默认严重程度
   */
  private static getDefaultSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.INVALID_GEOHASH:
      case ErrorType.CLIPBOARD_ERROR:
        return ErrorSeverity.LOW;
      
      case ErrorType.DECODE_FAILED:
      case ErrorType.COORDINATE_OUT_OF_RANGE:
      case ErrorType.FILE_EXPORT_ERROR:
      case ErrorType.VALIDATION_ERROR:
        return ErrorSeverity.MEDIUM;
      
      case ErrorType.NETWORK_ERROR:
      case ErrorType.BATCH_SIZE_EXCEEDED:
        return ErrorSeverity.HIGH;
      
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * 获取错误的默认建议
   */
  private static getDefaultSuggestions(type: ErrorType): string[] {
    switch (type) {
      case ErrorType.INVALID_GEOHASH:
        return ['检查输入格式', '参考示例进行输入'];
      
      case ErrorType.CLIPBOARD_ERROR:
        return ['手动复制文本', '检查浏览器权限'];
      
      case ErrorType.NETWORK_ERROR:
        return ['检查网络连接', '刷新页面重试'];
      
      default:
        return ['请重试', '如果问题持续存在，请联系技术支持'];
    }
  }

  /**
   * 判断错误是否可恢复
   */
  private static isRecoverable(type: ErrorType): boolean {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return false;
      default:
        return true;
    }
  }

  /**
   * 判断错误是否可重试
   */
  private static isRetryable(type: ErrorType): boolean {
    switch (type) {
      case ErrorType.INVALID_GEOHASH:
        return false; // 需要修正输入后才能重试
      default:
        return true;
    }
  }

  /**
   * 记录错误日志
   */
  private static logError(error: AppError, context?: ErrorContext): void {
    // 添加到错误日志
    this.errorLog.unshift(error);
    
    // 保持日志大小限制
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // 在开发环境下输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.severity.toUpperCase()} Error: ${error.type}`);
      console.error('Message:', error.message);
      if (error.details) console.error('Details:', error.details);
      if (error.input) console.error('Input:', error.input);
      if (context) console.error('Context:', context);
      if (error.suggestions?.length) {
        console.info('Suggestions:', error.suggestions);
      }
      console.groupEnd();
    }
  }

  /**
   * 获取错误日志
   */
  static getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * 清除错误日志
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 获取错误统计
   */
  static getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>
    };

    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}