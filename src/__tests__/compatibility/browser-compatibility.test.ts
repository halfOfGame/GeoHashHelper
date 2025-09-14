/**
 * 跨浏览器兼容性测试
 * 测试在不同浏览器环境下的功能兼容性
 */

import { ConversionEngine } from '../../lib/conversion-engine';
import { GeoHashDecoder } from '../../lib/geohash-decoder';
import { CoordinateConverter } from '../../lib/coordinate-converter';
import { OptimizedBatchProcessor } from '../../lib/optimized-batch-processor';

// Mock different browser environments
const mockBrowserEnvironments = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    features: {
      clipboard: true,
      performanceMemory: true,
      webWorkers: true,
      promises: true,
      asyncAwait: true,
    },
  },
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    features: {
      clipboard: true,
      performanceMemory: false, // Firefox doesn't expose performance.memory
      webWorkers: true,
      promises: true,
      asyncAwait: true,
    },
  },
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    features: {
      clipboard: true,
      performanceMemory: false,
      webWorkers: true,
      promises: true,
      asyncAwait: true,
    },
  },
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    features: {
      clipboard: true,
      performanceMemory: true,
      webWorkers: true,
      promises: true,
      asyncAwait: true,
    },
  },
  ie11: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    features: {
      clipboard: false, // IE11 doesn't support modern clipboard API
      performanceMemory: false,
      webWorkers: false, // Limited support
      promises: false, // Needs polyfill
      asyncAwait: false, // Not supported
    },
  },
};

describe('Browser Compatibility Tests', () => {
  let originalUserAgent: string;
  let originalClipboard: any;
  let originalPerformance: any;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
    originalClipboard = navigator.clipboard;
    originalPerformance = performance;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
    Object.defineProperty(global, 'performance', {
      value: originalPerformance,
      configurable: true,
    });
  });

  const mockBrowserEnvironment = (browserName: keyof typeof mockBrowserEnvironments) => {
    const env = mockBrowserEnvironments[browserName];
    
    // Mock user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: env.userAgent,
      configurable: true,
    });

    // Mock clipboard API
    if (env.features.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn(() => Promise.resolve()),
          readText: jest.fn(() => Promise.resolve('test')),
        },
        configurable: true,
      });
    } else {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });
    }

    // Mock performance.memory
    if (env.features.performanceMemory) {
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024,
          totalJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 200 * 1024 * 1024,
        },
        configurable: true,
      });
    } else {
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true,
      });
    }
  };

  describe('Core Algorithm Compatibility', () => {
    const testGeohashes = ['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3'];

    Object.keys(mockBrowserEnvironments).forEach(browserName => {
      describe(`${browserName.toUpperCase()} Browser`, () => {
        beforeEach(() => {
          mockBrowserEnvironment(browserName as keyof typeof mockBrowserEnvironments);
        });

        it('should decode geohashes correctly', () => {
          testGeohashes.forEach(geohash => {
            const result = GeoHashDecoder.decode(geohash);
            expect(result).toBeTruthy();
            expect(typeof result!.longitude).toBe('number');
            expect(typeof result!.latitude).toBe('number');
            expect(result!.longitude).toBeGreaterThan(-180);
            expect(result!.longitude).toBeLessThan(180);
            expect(result!.latitude).toBeGreaterThan(-90);
            expect(result!.latitude).toBeLessThan(90);
          });
        });

        it('should validate geohashes correctly', () => {
          expect(GeoHashDecoder.validate('wx4g0ec1')).toBe(true);
          expect(GeoHashDecoder.validate('invalid')).toBe(false);
          expect(GeoHashDecoder.validate('')).toBe(false);
          expect(GeoHashDecoder.validate('a')).toBe(false); // Contains invalid character
        });

        it('should convert coordinates correctly', () => {
          const bd09Point = { longitude: 116.404, latitude: 39.915 };
          const wgs84Result = CoordinateConverter.bd09ToWgs84(bd09Point.longitude, bd09Point.latitude);
          
          expect(wgs84Result).toBeTruthy();
          expect(typeof wgs84Result!.longitude).toBe('number');
          expect(typeof wgs84Result!.latitude).toBe('number');
        });

        it('should perform single conversion correctly', () => {
          const result = ConversionEngine.convertSingle('wx4g0ec1', 'BD09');
          
          expect(result.input).toBe('wx4g0ec1');
          expect(result.coordinateSystem).toBe('BD09');
          expect(typeof result.success).toBe('boolean');
          
          if (result.success) {
            expect(typeof result.longitude).toBe('number');
            expect(typeof result.latitude).toBe('number');
          } else {
            expect(typeof result.error).toBe('string');
          }
        });

        it('should perform batch conversion correctly', () => {
          const result = ConversionEngine.convertBatch(testGeohashes, 'GPS84');
          
          expect(result.results).toHaveLength(testGeohashes.length);
          expect(result.totalCount).toBe(testGeohashes.length);
          expect(result.successCount + result.errorCount).toBe(result.totalCount);
          expect(typeof result.processingTime).toBe('number');
        });
      });
    });
  });

  describe('Feature Detection and Fallbacks', () => {
    it('should handle missing clipboard API gracefully', () => {
      mockBrowserEnvironment('ie11');
      
      // Should not throw error when clipboard is not available
      expect(() => {
        const hasClipboard = 'clipboard' in navigator && navigator.clipboard;
        expect(hasClipboard).toBe(false);
      }).not.toThrow();
    });

    it('should handle missing performance.memory gracefully', () => {
      mockBrowserEnvironment('firefox');
      
      // Should not throw error when performance.memory is not available
      expect(() => {
        const hasMemoryAPI = 'memory' in performance;
        expect(hasMemoryAPI).toBe(false);
      }).not.toThrow();
    });

    it('should provide fallback for browsers without modern features', async () => {
      mockBrowserEnvironment('ie11');
      
      // Test that core functionality still works without modern features
      const result = ConversionEngine.convertSingle('wx4g0ec1', 'BD09');
      expect(result.success).toBe(true);
    });
  });

  describe('Performance Optimization Compatibility', () => {
    const largeGeohashList = Array.from({ length: 500 }, (_, i) => `wx4g0ec${i.toString().padStart(3, '0')}`);

    Object.keys(mockBrowserEnvironments).forEach(browserName => {
      const env = mockBrowserEnvironments[browserName as keyof typeof mockBrowserEnvironments];
      
      if (env.features.promises && env.features.asyncAwait) {
        describe(`${browserName.toUpperCase()} - Async Processing`, () => {
          beforeEach(() => {
            mockBrowserEnvironment(browserName as keyof typeof mockBrowserEnvironments);
          });

          it('should handle optimized batch processing', async () => {
            const result = await OptimizedBatchProcessor.processBatchOptimized(
              largeGeohashList.slice(0, 100), // Smaller batch for testing
              'BD09',
              { chunkSize: 25 }
            );

            expect(result.totalCount).toBe(100);
            expect(result.results).toHaveLength(100);
            expect(typeof result.processingTime).toBe('number');
            expect(typeof result.averageProcessingRate).toBe('number');
          });

          it('should handle progress callbacks', async () => {
            const progressUpdates: any[] = [];
            
            await OptimizedBatchProcessor.processBatchOptimized(
              largeGeohashList.slice(0, 50),
              'GPS84',
              {
                chunkSize: 10,
                progressCallback: (progress) => progressUpdates.push(progress),
              }
            );

            expect(progressUpdates.length).toBeGreaterThan(0);
            progressUpdates.forEach(progress => {
              expect(typeof progress.processed).toBe('number');
              expect(typeof progress.total).toBe('number');
              expect(typeof progress.percentage).toBe('number');
            });
          });
        });
      }
    });
  });

  describe('Memory Management Compatibility', () => {
    it('should work with browsers that support performance.memory', () => {
      mockBrowserEnvironment('chrome');
      
      // Should be able to access memory information
      expect('memory' in performance).toBe(true);
      expect(typeof (performance as any).memory.usedJSHeapSize).toBe('number');
    });

    it('should work with browsers that do not support performance.memory', () => {
      mockBrowserEnvironment('firefox');
      
      // Should handle absence of memory API gracefully
      expect('memory' in performance).toBe(false);
      
      // Core functionality should still work
      const result = ConversionEngine.convertSingle('wx4g0ec1', 'BD09');
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling Compatibility', () => {
    Object.keys(mockBrowserEnvironments).forEach(browserName => {
      describe(`${browserName.toUpperCase()} - Error Handling`, () => {
        beforeEach(() => {
          mockBrowserEnvironment(browserName as keyof typeof mockBrowserEnvironments);
        });

        it('should handle invalid input gracefully', () => {
          const invalidInputs = ['', 'a', 'invalid', '123456789012345']; // Too long
          
          invalidInputs.forEach(input => {
            expect(() => {
              const result = ConversionEngine.convertSingle(input, 'BD09');
              expect(typeof result.success).toBe('boolean');
            }).not.toThrow();
          });
        });

        it('should handle conversion errors gracefully', () => {
          expect(() => {
            const result = ConversionEngine.convertSingle('invalid', 'GPS84');
            expect(result.success).toBe(false);
            expect(typeof result.error).toBe('string');
          }).not.toThrow();
        });

        it('should handle batch processing errors gracefully', () => {
          const mixedInputs = ['wx4g0ec1', 'invalid', 'wx4g0ec2', ''];
          
          expect(() => {
            const result = ConversionEngine.convertBatch(mixedInputs, 'BD09');
            expect(result.totalCount).toBe(mixedInputs.length);
            expect(result.errorCount).toBeGreaterThan(0);
            expect(result.successCount).toBeGreaterThan(0);
          }).not.toThrow();
        });
      });
    });
  });

  describe('Data Type Compatibility', () => {
    it('should handle different number formats consistently', () => {
      const testCases = [
        { input: 'wx4g0ec1', expected: 'number' },
        { input: 'wx4g0ec123456', expected: 'number' },
        { input: 'wx4g', expected: 'number' },
      ];

      testCases.forEach(testCase => {
        Object.keys(mockBrowserEnvironments).forEach(browserName => {
          mockBrowserEnvironment(browserName as keyof typeof mockBrowserEnvironments);
          
          const result = ConversionEngine.convertSingle(testCase.input, 'BD09');
          if (result.success) {
            expect(typeof result.longitude).toBe(testCase.expected);
            expect(typeof result.latitude).toBe(testCase.expected);
            
            // Check for consistent precision
            expect(Number.isFinite(result.longitude!)).toBe(true);
            expect(Number.isFinite(result.latitude!)).toBe(true);
          }
        });
      });
    });

    it('should handle string operations consistently', () => {
      const testStrings = ['wx4g0ec1', 'WX4G0EC1', 'wx4g0ec1 ', ' wx4g0ec1'];
      
      Object.keys(mockBrowserEnvironments).forEach(browserName => {
        mockBrowserEnvironment(browserName as keyof typeof mockBrowserEnvironments);
        
        testStrings.forEach(testString => {
          expect(() => {
            const result = ConversionEngine.convertSingle(testString.trim().toLowerCase(), 'BD09');
            expect(typeof result.input).toBe('string');
          }).not.toThrow();
        });
      });
    });
  });

  describe('Performance Benchmarks', () => {
    const benchmarkGeohashes = Array.from({ length: 100 }, (_, i) => `wx4g0ec${i}`);

    Object.keys(mockBrowserEnvironments).forEach(browserName => {
      const env = mockBrowserEnvironments[browserName as keyof typeof mockBrowserEnvironments];
      
      if (env.features.promises) {
        it(`should maintain acceptable performance in ${browserName.toUpperCase()}`, async () => {
          mockBrowserEnvironment(browserName as keyof typeof mockBrowserEnvironments);
          
          const startTime = Date.now();
          const result = ConversionEngine.convertBatch(benchmarkGeohashes, 'BD09');
          const endTime = Date.now();
          
          const processingTime = endTime - startTime;
          const itemsPerSecond = benchmarkGeohashes.length / (processingTime / 1000);
          
          // Should process at least 10 items per second (very conservative)
          expect(itemsPerSecond).toBeGreaterThan(10);
          expect(result.successCount).toBe(benchmarkGeohashes.length);
        });
      }
    });
  });
});