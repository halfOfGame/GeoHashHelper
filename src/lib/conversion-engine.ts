/**
 * 转换引擎
 * 统一的转换引擎类，整合geohash解码和坐标转换功能
 * 实现错误处理和结果格式化
 */

import { GeoHashDecoder, GeoHashDecodeResult } from './geohash-decoder';
import { CoordinateConverter, CoordinatePoint } from './coordinate-converter';
import { ErrorHandler } from './error-handler';
import { ErrorType } from '../types/error-types';

export type CoordinateSystem = 'BD09' | 'GPS84';

export interface ConversionResult {
  input: string;
  success: boolean;
  longitude?: number;
  latitude?: number;
  error?: string;
  coordinateSystem: CoordinateSystem;
}

export interface BatchConversionResult {
  results: ConversionResult[];
  totalCount: number;
  successCount: number;
  errorCount: number;
  processingTime: number;
}

export enum ConversionErrorType {
  INVALID_GEOHASH = 'INVALID_GEOHASH',
  DECODE_FAILED = 'DECODE_FAILED',
  COORDINATE_CONVERSION_FAILED = 'COORDINATE_CONVERSION_FAILED',
  COORDINATE_OUT_OF_RANGE = 'COORDINATE_OUT_OF_RANGE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ConversionError {
  type: ConversionErrorType;
  message: string;
  input: string;
  suggestions?: string[];
}

export class ConversionEngine {
  /**
   * 获取友好的错误信息
   * @param errorType - 错误类型
   * @param input - 输入的geohash
   * @returns 格式化的错误信息
   */
  private static getErrorMessage(errorType: ConversionErrorType, input: string): ConversionError {
    switch (errorType) {
      case ConversionErrorType.INVALID_GEOHASH:
        return {
          type: errorType,
          message: `无效的geohash格式: "${input}"`,
          input,
          suggestions: [
            '确保geohash只包含有效字符: 0-9, b-z (除了a, i, l, o)',
            '检查geohash长度是否在1-12位之间',
            '示例有效geohash: wx4g0ec1, 9q9hvu, u4pruydq'
          ]
        };
      
      case ConversionErrorType.DECODE_FAILED:
        return {
          type: errorType,
          message: `geohash解码失败: "${input}"`,
          input,
          suggestions: [
            '检查geohash是否完整',
            '确认geohash来源是否可靠',
            '尝试使用较短的geohash前缀'
          ]
        };
      
      case ConversionErrorType.COORDINATE_CONVERSION_FAILED:
        return {
          type: errorType,
          message: `坐标系转换失败: "${input}"`,
          input,
          suggestions: [
            '检查解码后的坐标是否在有效范围内',
            '确认原始坐标系类型是否正确'
          ]
        };
      
      case ConversionErrorType.COORDINATE_OUT_OF_RANGE:
        return {
          type: errorType,
          message: `坐标超出有效范围: "${input}"`,
          input,
          suggestions: [
            '经度应在-180到180度之间',
            '纬度应在-90到90度之间'
          ]
        };
      
      default:
        return {
          type: ConversionErrorType.UNKNOWN_ERROR,
          message: `转换过程中发生未知错误: "${input}"`,
          input,
          suggestions: [
            '请检查输入格式',
            '如果问题持续存在，请联系技术支持'
          ]
        };
    }
  }

  /**
   * 单个geohash转换
   * @param geohash - geohash字符串
   * @param coordinateSystem - 原始坐标系类型
   * @returns 转换结果
   */
  static convertSingle(geohash: string, coordinateSystem: CoordinateSystem): ConversionResult {
    const baseResult: ConversionResult = {
      input: geohash,
      success: false,
      coordinateSystem
    };

    try {
      // 步骤1: 验证和解码geohash
      if (!GeoHashDecoder.validate(geohash)) {
        const error = ErrorHandler.handleConversionError(ErrorType.INVALID_GEOHASH, geohash);
        return {
          ...baseResult,
          error: error.message
        };
      }

      const decodedResult: GeoHashDecodeResult | null = GeoHashDecoder.decode(geohash);
      if (!decodedResult) {
        const error = ErrorHandler.handleConversionError(ErrorType.DECODE_FAILED, geohash);
        return {
          ...baseResult,
          error: error.message
        };
      }

      // 步骤2: 坐标系转换（如果需要）
      let finalCoordinates: CoordinatePoint;

      if (coordinateSystem === 'BD09') {
        // BD09 -> WGS84 转换
        const convertedResult = CoordinateConverter.bd09ToWgs84(
          decodedResult.longitude,
          decodedResult.latitude
        );
        
        if (!convertedResult) {
          const error = ErrorHandler.handleConversionError(ErrorType.COORDINATE_OUT_OF_RANGE, geohash);
          return {
            ...baseResult,
            error: error.message
          };
        }
        
        finalCoordinates = convertedResult;
      } else {
        // GPS84 坐标系，直接使用解码结果
        finalCoordinates = {
          longitude: decodedResult.longitude,
          latitude: decodedResult.latitude
        };
      }

      // 步骤3: 验证最终坐标范围
      const validation = CoordinateConverter.validateCoordinates(
        finalCoordinates.longitude,
        finalCoordinates.latitude
      );

      if (!validation.isValid) {
        const error = ErrorHandler.handleConversionError(ErrorType.COORDINATE_OUT_OF_RANGE, geohash);
        return {
          ...baseResult,
          error: error.message
        };
      }

      // 成功返回结果
      return {
        ...baseResult,
        success: true,
        longitude: finalCoordinates.longitude,
        latitude: finalCoordinates.latitude
      };

    } catch (error) {
      const conversionError = ErrorHandler.handleConversionError(ErrorType.UNKNOWN_ERROR, geohash);
      return {
        ...baseResult,
        error: conversionError.message
      };
    }
  }

  /**
   * 批量geohash转换
   * @param geohashList - geohash字符串数组
   * @param coordinateSystem - 原始坐标系类型
   * @returns 批量转换结果
   */
  static convertBatch(geohashList: string[], coordinateSystem: CoordinateSystem): BatchConversionResult {
    const startTime = Date.now();
    
    const results: ConversionResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    // 处理每个geohash
    for (const geohash of geohashList) {
      const result = this.convertSingle(geohash.trim(), coordinateSystem);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      results,
      totalCount: geohashList.length,
      successCount,
      errorCount,
      processingTime
    };
  }

  /**
   * 解析批量输入文本
   * @param input - 输入文本（支持换行符和逗号分隔）
   * @returns 清理后的geohash数组
   */
  static parseInput(input: string): string[] {
    if (!input || typeof input !== 'string') {
      return [];
    }

    // 支持换行符和逗号分隔
    const geohashList = input
      .split(/[\n,]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);

    // 去重
    return Array.from(new Set(geohashList));
  }

  /**
   * 格式化转换结果为CSV格式
   * @param results - 转换结果数组
   * @returns CSV格式字符串
   */
  static formatResultsAsCSV(results: ConversionResult[]): string {
    const headers = ['输入GeoHash', '转换状态', '经度', '纬度', '坐标系', '错误信息'];
    const csvRows = [headers.join(',')];

    results.forEach(result => {
      const row = [
        `"${result.input}"`,
        result.success ? '成功' : '失败',
        result.longitude?.toString() || '',
        result.latitude?.toString() || '',
        result.coordinateSystem === 'BD09' ? '百度09' : 'GPS84',
        result.error ? `"${result.error}"` : ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * 生成转换结果摘要
   * @param batchResult - 批量转换结果
   * @returns 结果摘要字符串
   */
  static generateSummary(batchResult: BatchConversionResult): string {
    const { totalCount, successCount, errorCount, processingTime } = batchResult;
    const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '0';

    return `转换完成！
总计: ${totalCount} 个
成功: ${successCount} 个
失败: ${errorCount} 个
成功率: ${successRate}%
处理时间: ${processingTime}ms`;
  }
}