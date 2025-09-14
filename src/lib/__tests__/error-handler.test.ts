/**
 * 错误处理器测试
 */

import { ErrorHandler } from '../error-handler';
import { ErrorType, ErrorSeverity } from '../../types/error-types';

describe('ErrorHandler', () => {
  beforeEach(() => {
    // 清除错误日志
    ErrorHandler.clearErrorLog();
  });

  describe('createError', () => {
    it('应该创建基本错误对象', () => {
      const error = ErrorHandler.createError(
        ErrorType.INVALID_GEOHASH,
        'Test error message'
      );

      expect(error.type).toBe(ErrorType.INVALID_GEOHASH);
      expect(error.message).toBe('Test error message');
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.recoverable).toBe(true);
      expect(error.retryable).toBe(false);
    });

    it('应该使用自定义选项创建错误', () => {
      const error = ErrorHandler.createError(
        ErrorType.NETWORK_ERROR,
        'Network failed',
        { component: 'TestComponent' },
        {
          severity: ErrorSeverity.HIGH,
          details: 'Connection timeout',
          suggestions: ['Check network'],
          recoverable: false,
          retryable: true
        }
      );

      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.details).toBe('Connection timeout');
      expect(error.suggestions).toEqual(['Check network']);
      expect(error.recoverable).toBe(false);
      expect(error.retryable).toBe(true);
    });
  });

  describe('handleConversionError', () => {
    it('应该处理无效geohash错误', () => {
      const error = ErrorHandler.handleConversionError(
        ErrorType.INVALID_GEOHASH,
        'invalid_hash'
      );

      expect(error.type).toBe(ErrorType.INVALID_GEOHASH);
      expect(error.message).toContain('invalid_hash');
      expect(error.input).toBe('invalid_hash');
      expect(error.suggestions).toContain('确保GeoHash只包含有效字符: 0-9, b-z (除了a, i, l, o)');
      expect(error.retryable).toBe(false);
    });

    it('应该处理解码失败错误', () => {
      const error = ErrorHandler.handleConversionError(
        ErrorType.DECODE_FAILED,
        'wx4g0ec1'
      );

      expect(error.type).toBe(ErrorType.DECODE_FAILED);
      expect(error.message).toContain('解码失败');
      expect(error.suggestions).toContain('检查GeoHash是否完整');
      expect(error.retryable).toBe(true);
    });

    it('应该处理坐标超出范围错误', () => {
      const error = ErrorHandler.handleConversionError(
        ErrorType.COORDINATE_OUT_OF_RANGE,
        'invalid_coord'
      );

      expect(error.type).toBe(ErrorType.COORDINATE_OUT_OF_RANGE);
      expect(error.suggestions).toContain('经度应在-180到180度之间');
      expect(error.suggestions).toContain('纬度应在-90到90度之间');
    });
  });

  describe('handleSystemError', () => {
    it('应该处理剪贴板错误', () => {
      const originalError = new Error('Clipboard access denied');
      const error = ErrorHandler.handleSystemError(
        ErrorType.CLIPBOARD_ERROR,
        originalError
      );

      expect(error.type).toBe(ErrorType.CLIPBOARD_ERROR);
      expect(error.message).toBe('复制到剪贴板失败');
      expect(error.details).toBe('Clipboard access denied');
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.suggestions).toContain('请手动选择文本进行复制');
    });

    it('应该处理文件导出错误', () => {
      const error = ErrorHandler.handleSystemError(ErrorType.FILE_EXPORT_ERROR);

      expect(error.type).toBe(ErrorType.FILE_EXPORT_ERROR);
      expect(error.message).toBe('文件导出失败');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.suggestions).toContain('检查浏览器下载设置');
    });

    it('应该处理网络错误', () => {
      const error = ErrorHandler.handleSystemError(ErrorType.NETWORK_ERROR);

      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.suggestions).toContain('检查网络连接');
    });
  });

  describe('handleBatchError', () => {
    it('应该处理低错误率的批量错误', () => {
      const sampleErrors = [
        ErrorHandler.handleConversionError(ErrorType.INVALID_GEOHASH, 'test1')
      ];
      
      const error = ErrorHandler.handleBatchError(2, 20, sampleErrors);

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.message).toContain('少量失败');
    });

    it('应该处理中等错误率的批量错误', () => {
      const sampleErrors = [
        ErrorHandler.handleConversionError(ErrorType.DECODE_FAILED, 'test1')
      ];
      
      const error = ErrorHandler.handleBatchError(5, 20, sampleErrors);

      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.message).toContain('部分失败');
    });

    it('应该处理高错误率的批量错误', () => {
      const sampleErrors = [
        ErrorHandler.handleConversionError(ErrorType.INVALID_GEOHASH, 'test1')
      ];
      
      const error = ErrorHandler.handleBatchError(15, 20, sampleErrors);

      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.message).toContain('失败率过高');
    });

    it('应该为包含无效geohash的批量错误添加特定建议', () => {
      const sampleErrors = [
        ErrorHandler.handleConversionError(ErrorType.INVALID_GEOHASH, 'test1')
      ];
      
      const error = ErrorHandler.handleBatchError(5, 20, sampleErrors);

      expect(error.suggestions).toContain('检查GeoHash格式是否正确');
    });
  });

  describe('错误日志管理', () => {
    it('应该记录错误到日志', () => {
      const error = ErrorHandler.createError(
        ErrorType.INVALID_GEOHASH,
        'Test error'
      );

      const log = ErrorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toEqual(error);
    });

    it('应该限制日志大小', () => {
      // 创建超过限制的错误数量
      for (let i = 0; i < 150; i++) {
        ErrorHandler.createError(
          ErrorType.INVALID_GEOHASH,
          `Error ${i}`
        );
      }

      const log = ErrorHandler.getErrorLog();
      expect(log.length).toBeLessThanOrEqual(100);
    });

    it('应该清除错误日志', () => {
      ErrorHandler.createError(ErrorType.INVALID_GEOHASH, 'Test error');
      expect(ErrorHandler.getErrorLog()).toHaveLength(1);

      ErrorHandler.clearErrorLog();
      expect(ErrorHandler.getErrorLog()).toHaveLength(0);
    });

    it('应该生成错误统计', () => {
      ErrorHandler.createError(ErrorType.INVALID_GEOHASH, 'Error 1');
      ErrorHandler.createError(ErrorType.INVALID_GEOHASH, 'Error 2');
      ErrorHandler.createError(ErrorType.DECODE_FAILED, 'Error 3');

      const stats = ErrorHandler.getErrorStats();
      expect(stats.total).toBe(3);
      expect(stats.byType[ErrorType.INVALID_GEOHASH]).toBe(2);
      expect(stats.byType[ErrorType.DECODE_FAILED]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(2);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
    });
  });
});