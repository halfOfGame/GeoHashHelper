/**
 * 端到端测试设置文件
 */

import '@testing-library/jest-dom';

// Mock global APIs that might not be available in test environment
global.URL = global.URL || {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
};

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('test')),
  },
  configurable: true,
});

// Mock performance.memory for browsers that support it
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024,
  },
  configurable: true,
});

// Mock ResizeObserver for virtualized components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for virtualized components
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Increase timeout for async operations
jest.setTimeout(30000);

// Setup console error/warning suppression for expected errors in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress specific expected errors
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render is deprecated') ||
       message.includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    // Suppress specific expected warnings
    const message = args[0];
    if (
      typeof message === 'string' &&
      message.includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
export const waitForAsync = (ms: number = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockAsyncOperation = <T>(result: T, delay: number = 100): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(result), delay));

export const mockAsyncError = (error: Error, delay: number = 100): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(error), delay));

// Test data generators
export const generateTestGeohashes = (count: number, valid: boolean = true): string[] => {
  return Array.from({ length: count }, (_, i) => {
    if (valid) {
      return `wx4g0ec${i.toString().padStart(3, '0')}`;
    } else {
      return i % 2 === 0 ? `invalid${i}` : `wx4g0ec${i}`;
    }
  });
};

export const generateTestResults = (count: number, successRate: number = 0.8) => {
  return Array.from({ length: count }, (_, i) => {
    const isSuccess = Math.random() < successRate;
    return {
      input: `wx4g0ec${i.toString().padStart(3, '0')}`,
      success: isSuccess,
      longitude: isSuccess ? 116.404 + i * 0.001 : undefined,
      latitude: isSuccess ? 39.915 + i * 0.001 : undefined,
      error: isSuccess ? undefined : 'Test error',
      coordinateSystem: 'BD09' as const,
    };
  });
};

// Performance testing utilities
export const measurePerformance = async <T>(
  operation: () => Promise<T> | T,
  label: string = 'Operation'
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
};

// Memory testing utilities
export const getMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // MB
  }
  return 0;
};

export const measureMemoryUsage = async <T>(
  operation: () => Promise<T> | T,
  label: string = 'Operation'
): Promise<{ result: T; memoryDelta: number }> => {
  const initialMemory = getMemoryUsage();
  const result = await operation();
  const finalMemory = getMemoryUsage();
  const memoryDelta = finalMemory - initialMemory;
  
  console.log(`${label} memory delta: ${memoryDelta.toFixed(2)}MB`);
  
  return { result, memoryDelta };
};