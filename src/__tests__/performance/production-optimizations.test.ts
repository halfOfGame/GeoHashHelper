/**
 * @jest-environment jsdom
 */

import {
  optimizeImage,
  addResourceHints,
  createLazyLoadObserver,
  monitorMemoryUsage,
} from '../../lib/production-optimizations';

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 10000000,
    },
  },
  writable: true,
});

describe('Production Optimizations', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('optimizeImage', () => {
    it('should add optimization parameters in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const result = optimizeImage('/test-image.jpg', 800, 80);
      expect(result).toBe('/test-image.jpg?w=800&q=80');

      process.env.NODE_ENV = originalEnv;
    });

    it('should return original src in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const result = optimizeImage('/test-image.jpg', 800, 80);
      expect(result).toBe('/test-image.jpg');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('addResourceHints', () => {
    it('should add DNS prefetch and preconnect links', () => {
      addResourceHints();

      const dnsPrefetchLinks = document.querySelectorAll('link[rel="dns-prefetch"]');
      const preconnectLinks = document.querySelectorAll('link[rel="preconnect"]');

      expect(dnsPrefetchLinks.length).toBeGreaterThan(0);
      expect(preconnectLinks.length).toBeGreaterThan(0);

      // Check specific domains
      const googleFontsDnsPrefetch = Array.from(dnsPrefetchLinks).find(
        link => (link as HTMLLinkElement).href.includes('fonts.googleapis.com')
      );
      expect(googleFontsDnsPrefetch).toBeTruthy();
    });
  });

  describe('createLazyLoadObserver', () => {
    it('should create intersection observer when supported', () => {
      const mockCallback = jest.fn();
      const observer = createLazyLoadObserver(mockCallback);

      expect(observer).toBeInstanceOf(IntersectionObserver);
    });

    it('should return null when IntersectionObserver is not supported', () => {
      const originalIntersectionObserver = window.IntersectionObserver;
      // @ts-ignore
      delete window.IntersectionObserver;

      const mockCallback = jest.fn();
      const observer = createLazyLoadObserver(mockCallback);

      expect(observer).toBeNull();

      window.IntersectionObserver = originalIntersectionObserver;
    });
  });

  describe('monitorMemoryUsage', () => {
    it('should log memory usage when performance.memory is available', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      monitorMemoryUsage();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Memory usage:',
        expect.objectContaining({
          usedJSHeapSize: expect.any(Number),
          totalJSHeapSize: expect.any(Number),
          jsHeapSizeLimit: expect.any(Number),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should warn when memory usage is high', () => {
      // Mock high memory usage
      Object.defineProperty(window, 'performance', {
        value: {
          memory: {
            usedJSHeapSize: 9000000, // 90% of limit
            totalJSHeapSize: 9500000,
            jsHeapSizeLimit: 10000000,
          },
        },
        writable: true,
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      monitorMemoryUsage();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'High memory usage detected:',
        '90.00%'
      );

      consoleWarnSpy.mockRestore();
    });
  });
});