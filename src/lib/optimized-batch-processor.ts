/**
 * 优化的批量处理器
 * 支持大批量数据的分块处理、进度更新和内存优化
 */

import { ConversionEngine, ConversionResult, CoordinateSystem } from './conversion-engine';

export interface BatchProcessingOptions {
  chunkSize: number;
  maxConcurrency: number;
  progressCallback?: (progress: BatchProgress) => void;
  shouldCancel?: () => boolean;
}

export interface BatchProgress {
  processed: number;
  total: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
  processingRate: number; // items per second
  estimatedTimeRemaining: number; // seconds
  memoryUsage?: number; // MB
}

export interface OptimizedBatchResult {
  results: ConversionResult[];
  totalCount: number;
  successCount: number;
  errorCount: number;
  processingTime: number;
  averageProcessingRate: number;
  peakMemoryUsage: number;
  cancelled: boolean;
}

export class OptimizedBatchProcessor {
  private static readonly DEFAULT_CHUNK_SIZE = 100;
  private static readonly DEFAULT_MAX_CONCURRENCY = 4;
  private static readonly MEMORY_CHECK_INTERVAL = 50; // Check memory every 50 items

  /**
   * 分块处理大批量数据
   * @param geohashList - geohash字符串数组
   * @param coordinateSystem - 坐标系类型
   * @param options - 处理选项
   * @returns 优化的批量处理结果
   */
  static async processBatchOptimized(
    geohashList: string[],
    coordinateSystem: CoordinateSystem,
    options: Partial<BatchProcessingOptions> = {}
  ): Promise<OptimizedBatchResult> {
    const {
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      maxConcurrency = this.DEFAULT_MAX_CONCURRENCY,
      progressCallback,
      shouldCancel
    } = options;

    const startTime = Date.now();
    const totalCount = geohashList.length;
    const chunks = this.createChunks(geohashList, chunkSize);
    const totalChunks = chunks.length;
    
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let peakMemoryUsage = 0;
    let cancelled = false;
    
    const allResults: ConversionResult[] = [];
    const processingRates: number[] = [];

    // 处理每个分块
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // 检查是否需要取消
      if (shouldCancel && shouldCancel()) {
        cancelled = true;
        break;
      }

      const chunk = chunks[chunkIndex];
      const chunkStartTime = Date.now();
      
      // 处理当前分块
      const chunkResults = await this.processChunkWithConcurrency(
        chunk,
        coordinateSystem,
        maxConcurrency
      );
      
      // 更新统计信息
      allResults.push(...chunkResults);
      processedCount += chunk.length;
      
      chunkResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });

      // 计算处理速度
      const chunkProcessingTime = Date.now() - chunkStartTime;
      const chunkRate = chunk.length / (chunkProcessingTime / 1000);
      processingRates.push(chunkRate);

      // 检查内存使用情况
      if (chunkIndex % this.MEMORY_CHECK_INTERVAL === 0) {
        const currentMemory = this.estimateMemoryUsage(allResults);
        peakMemoryUsage = Math.max(peakMemoryUsage, currentMemory);
      }

      // 更新进度
      if (progressCallback) {
        const averageRate = processingRates.reduce((sum, rate) => sum + rate, 0) / processingRates.length;
        const remainingItems = totalCount - processedCount;
        const estimatedTimeRemaining = remainingItems / averageRate;

        const progress: BatchProgress = {
          processed: processedCount,
          total: totalCount,
          percentage: (processedCount / totalCount) * 100,
          currentChunk: chunkIndex + 1,
          totalChunks,
          processingRate: chunkRate,
          estimatedTimeRemaining,
          memoryUsage: peakMemoryUsage
        };

        progressCallback(progress);
      }

      // 在分块之间添加短暂延迟，避免阻塞UI
      if (chunkIndex < totalChunks - 1) {
        await this.sleep(1);
      }
    }

    const processingTime = Date.now() - startTime;
    const averageProcessingRate = totalCount / (processingTime / 1000);

    return {
      results: allResults,
      totalCount,
      successCount,
      errorCount,
      processingTime,
      averageProcessingRate,
      peakMemoryUsage,
      cancelled
    };
  }

  /**
   * 使用并发处理单个分块
   * @param chunk - 当前分块的geohash数组
   * @param coordinateSystem - 坐标系类型
   * @param maxConcurrency - 最大并发数
   * @returns 分块处理结果
   */
  private static async processChunkWithConcurrency(
    chunk: string[],
    coordinateSystem: CoordinateSystem,
    maxConcurrency: number
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    
    // 将分块进一步分割为并发批次
    const concurrentBatches = this.createChunks(chunk, Math.ceil(chunk.length / maxConcurrency));
    
    // 并发处理所有批次
    const batchPromises = concurrentBatches.map(async (batch) => {
      return batch.map(geohash => ConversionEngine.convertSingle(geohash, coordinateSystem));
    });

    const batchResults = await Promise.all(batchPromises);
    
    // 合并结果
    batchResults.forEach(batch => {
      results.push(...batch);
    });

    return results;
  }

  /**
   * 创建数据分块
   * @param array - 原始数组
   * @param chunkSize - 分块大小
   * @returns 分块后的数组
   */
  private static createChunks<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 估算内存使用量
   * @param results - 转换结果数组
   * @returns 估算的内存使用量（MB）
   */
  private static estimateMemoryUsage(results: ConversionResult[]): number {
    // 粗略估算每个结果对象的内存占用
    const avgResultSize = 200; // bytes per result object
    const totalBytes = results.length * avgResultSize;
    return totalBytes / (1024 * 1024); // Convert to MB
  }

  /**
   * 异步延迟函数
   * @param ms - 延迟毫秒数
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取推荐的分块大小
   * @param totalItems - 总项目数
   * @param availableMemory - 可用内存（MB）
   * @returns 推荐的分块大小
   */
  static getRecommendedChunkSize(totalItems: number, availableMemory: number = 100): number {
    // 基于可用内存和总项目数计算推荐分块大小
    const maxItemsPerMB = 5000; // 每MB内存大约可处理的项目数
    const maxItemsForMemory = availableMemory * maxItemsPerMB;
    
    if (totalItems <= 100) {
      return totalItems; // 小批量直接处理
    } else if (totalItems <= 1000) {
      return 100;
    } else if (totalItems <= 10000) {
      return Math.min(500, maxItemsForMemory);
    } else {
      return Math.min(1000, maxItemsForMemory);
    }
  }

  /**
   * 检查批量大小是否需要优化处理
   * @param itemCount - 项目数量
   * @returns 是否需要优化处理
   */
  static shouldUseOptimizedProcessing(itemCount: number): boolean {
    return itemCount > 200; // 超过200项使用优化处理
  }

  /**
   * 获取处理性能建议
   * @param itemCount - 项目数量
   * @returns 性能建议
   */
  static getPerformanceRecommendations(itemCount: number): {
    useOptimized: boolean;
    chunkSize: number;
    maxConcurrency: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let chunkSize = this.DEFAULT_CHUNK_SIZE;
    let maxConcurrency = this.DEFAULT_MAX_CONCURRENCY;
    
    if (itemCount > 10000) {
      warnings.push('大批量数据可能需要较长处理时间，建议分批处理');
      chunkSize = 1000;
      maxConcurrency = 2; // 减少并发以避免内存压力
    } else if (itemCount > 5000) {
      warnings.push('中等批量数据，将使用优化处理');
      chunkSize = 500;
    } else if (itemCount > 1000) {
      chunkSize = 200;
    }

    return {
      useOptimized: this.shouldUseOptimizedProcessing(itemCount),
      chunkSize,
      maxConcurrency,
      warnings
    };
  }
}

/**
 * 内存监控工具
 */
export class MemoryMonitor {
  private static measurements: number[] = [];
  
  /**
   * 记录内存使用情况
   */
  static recordMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
      this.measurements.push(usedMB);
      
      // 只保留最近100次测量
      if (this.measurements.length > 100) {
        this.measurements = this.measurements.slice(-100);
      }
    }
  }

  /**
   * 获取内存使用统计
   */
  static getMemoryStats(): {
    current: number;
    peak: number;
    average: number;
    available: boolean;
  } {
    if (this.measurements.length === 0) {
      return {
        current: 0,
        peak: 0,
        average: 0,
        available: false
      };
    }

    const current = this.measurements[this.measurements.length - 1];
    const peak = Math.max(...this.measurements);
    const average = this.measurements.reduce((sum, val) => sum + val, 0) / this.measurements.length;

    return {
      current,
      peak,
      average,
      available: true
    };
  }

  /**
   * 清除内存测量记录
   */
  static clearMeasurements(): void {
    this.measurements = [];
  }
}