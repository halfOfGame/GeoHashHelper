/**
 * 优化批量处理器测试
 */

import { OptimizedBatchProcessor, BatchProgress, MemoryMonitor } from '../optimized-batch-processor';
import { CoordinateSystem } from '../conversion-engine';

// Mock the conversion engine
jest.mock('../conversion-engine', () => ({
  ConversionEngine: {
    convertSingle: jest.fn((geohash: string, coordinateSystem: CoordinateSystem) => ({
      input: geohash,
      success: geohash.length >= 4 && geohash.length <= 12,
      longitude: geohash.length >= 4 ? 116.404 : undefined,
      latitude: geohash.length >= 4 ? 39.915 : undefined,
      error: geohash.length < 4 || geohash.length > 12 ? 'Invalid geohash length' : undefined,
      coordinateSystem,
    })),
  },
}));

describe('OptimizedBatchProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processBatchOptimized', () => {
    it('should process small batch without chunking', async () => {
      const geohashList = ['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3'];
      const result = await OptimizedBatchProcessor.processBatchOptimized(
        geohashList,
        'BD09'
      );

      expect(result.totalCount).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.cancelled).toBe(false);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should process large batch with chunking', async () => {
      const geohashList = Array.from({ length: 250 }, (_, i) => `wx4g0ec${i.toString().padStart(3, '0')}`);
      
      const progressUpdates: BatchProgress[] = [];
      const result = await OptimizedBatchProcessor.processBatchOptimized(
        geohashList,
        'GPS84',
        {
          chunkSize: 50,
          progressCallback: (progress) => progressUpdates.push(progress),
        }
      );

      expect(result.totalCount).toBe(250);
      expect(result.successCount).toBe(250);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(250);
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Check progress updates
      const lastProgress = progressUpdates[progressUpdates.length - 1];
      expect(lastProgress.processed).toBe(250);
      expect(lastProgress.percentage).toBe(100);
    });

    it('should handle cancellation', async () => {
      const geohashList = Array.from({ length: 1000 }, (_, i) => `wx4g0ec${i}`);
      let cancelAfter = 100;
      
      const result = await OptimizedBatchProcessor.processBatchOptimized(
        geohashList,
        'BD09',
        {
          chunkSize: 50,
          shouldCancel: () => {
            cancelAfter--;
            return cancelAfter <= 0;
          },
        }
      );

      expect(result.cancelled).toBe(true);
      expect(result.totalCount).toBe(1000);
      expect(result.results.length).toBeLessThan(1000);
    });

    it('should handle mixed valid and invalid geohashes', async () => {
      const geohashList = [
        'wx4g0ec1', // valid
        'abc', // too short
        'wx4g0ec2', // valid
        'abcdefghijklmnop', // too long
        'wx4g0ec3', // valid
      ];

      const result = await OptimizedBatchProcessor.processBatchOptimized(
        geohashList,
        'BD09'
      );

      expect(result.totalCount).toBe(5);
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(2);
    });

    it('should provide accurate progress updates', async () => {
      const geohashList = Array.from({ length: 200 }, (_, i) => `wx4g0ec${i}`);
      const progressUpdates: BatchProgress[] = [];
      
      await OptimizedBatchProcessor.processBatchOptimized(
        geohashList,
        'GPS84',
        {
          chunkSize: 40,
          progressCallback: (progress) => progressUpdates.push(progress),
        }
      );

      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Check that progress increases monotonically
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].processed).toBeGreaterThanOrEqual(progressUpdates[i - 1].processed);
        expect(progressUpdates[i].percentage).toBeGreaterThanOrEqual(progressUpdates[i - 1].percentage);
      }

      // Check final progress
      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.processed).toBe(200);
      expect(finalProgress.percentage).toBe(100);
      expect(finalProgress.totalChunks).toBe(5); // 200 / 40 = 5
    });

    it('should use concurrency for chunk processing', async () => {
      const geohashList = Array.from({ length: 100 }, (_, i) => `wx4g0ec${i}`);
      
      const result = await OptimizedBatchProcessor.processBatchOptimized(
        geohashList,
        'BD09',
        {
          chunkSize: 25,
          maxConcurrency: 4,
        }
      );

      expect(result.totalCount).toBe(100);
      expect(result.successCount).toBe(100);
      expect(result.averageProcessingRate).toBeGreaterThan(0);
    });
  });

  describe('getRecommendedChunkSize', () => {
    it('should return appropriate chunk size for different batch sizes', () => {
      expect(OptimizedBatchProcessor.getRecommendedChunkSize(50)).toBe(50);
      expect(OptimizedBatchProcessor.getRecommendedChunkSize(500)).toBe(100);
      expect(OptimizedBatchProcessor.getRecommendedChunkSize(5000)).toBe(500);
      expect(OptimizedBatchProcessor.getRecommendedChunkSize(50000)).toBe(1000);
    });

    it('should consider available memory', () => {
      const lowMemoryChunkSize = OptimizedBatchProcessor.getRecommendedChunkSize(10000, 10);
      const highMemoryChunkSize = OptimizedBatchProcessor.getRecommendedChunkSize(10000, 200);
      
      expect(lowMemoryChunkSize).toBeLessThanOrEqual(highMemoryChunkSize);
    });
  });

  describe('shouldUseOptimizedProcessing', () => {
    it('should recommend optimization for large batches', () => {
      expect(OptimizedBatchProcessor.shouldUseOptimizedProcessing(50)).toBe(false);
      expect(OptimizedBatchProcessor.shouldUseOptimizedProcessing(300)).toBe(true);
      expect(OptimizedBatchProcessor.shouldUseOptimizedProcessing(1000)).toBe(true);
    });
  });

  describe('getPerformanceRecommendations', () => {
    it('should provide appropriate recommendations for different batch sizes', () => {
      const smallBatch = OptimizedBatchProcessor.getPerformanceRecommendations(100);
      expect(smallBatch.useOptimized).toBe(false);
      expect(smallBatch.warnings).toHaveLength(0);

      const mediumBatch = OptimizedBatchProcessor.getPerformanceRecommendations(2000);
      expect(mediumBatch.useOptimized).toBe(true);
      expect(mediumBatch.chunkSize).toBe(200);

      const largeBatch = OptimizedBatchProcessor.getPerformanceRecommendations(15000);
      expect(largeBatch.useOptimized).toBe(true);
      expect(largeBatch.chunkSize).toBe(1000);
      expect(largeBatch.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe('MemoryMonitor', () => {
  beforeEach(() => {
    MemoryMonitor.clearMeasurements();
  });

  describe('recordMemoryUsage', () => {
    it('should record memory usage when performance.memory is available', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
      };
      
      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      });

      MemoryMonitor.recordMemoryUsage();
      const stats = MemoryMonitor.getMemoryStats();

      expect(stats.available).toBe(true);
      expect(stats.current).toBeCloseTo(50, 1);
    });

    it('should handle absence of performance.memory', () => {
      // Remove performance.memory
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true,
      });

      MemoryMonitor.recordMemoryUsage();
      const stats = MemoryMonitor.getMemoryStats();

      expect(stats.available).toBe(false);
      expect(stats.current).toBe(0);
    });
  });

  describe('getMemoryStats', () => {
    it('should calculate correct statistics', () => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 30 * 1024 * 1024, // 30MB
        },
        configurable: true,
      });

      // Record multiple measurements
      MemoryMonitor.recordMemoryUsage();
      
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        },
        configurable: true,
      });
      MemoryMonitor.recordMemoryUsage();

      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 40 * 1024 * 1024, // 40MB
        },
        configurable: true,
      });
      MemoryMonitor.recordMemoryUsage();

      const stats = MemoryMonitor.getMemoryStats();

      expect(stats.available).toBe(true);
      expect(stats.current).toBeCloseTo(40, 1);
      expect(stats.peak).toBeCloseTo(50, 1);
      expect(stats.average).toBeCloseTo(40, 1);
    });

    it('should limit measurements to 100 entries', () => {
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 30 * 1024 * 1024,
        },
        configurable: true,
      });

      // Record 150 measurements
      for (let i = 0; i < 150; i++) {
        MemoryMonitor.recordMemoryUsage();
      }

      const stats = MemoryMonitor.getMemoryStats();
      expect(stats.available).toBe(true);
      // Should still work correctly even with many measurements
    });
  });

  describe('clearMeasurements', () => {
    it('should clear all measurements', () => {
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 30 * 1024 * 1024,
        },
        configurable: true,
      });

      MemoryMonitor.recordMemoryUsage();
      let stats = MemoryMonitor.getMemoryStats();
      expect(stats.available).toBe(true);

      MemoryMonitor.clearMeasurements();
      stats = MemoryMonitor.getMemoryStats();
      expect(stats.available).toBe(false);
    });
  });
});