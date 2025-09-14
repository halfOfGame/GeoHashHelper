/**
 * Jest配置文件 - 端到端测试
 */

const baseConfig = require('../../../jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: 'E2E Tests',
  testMatch: [
    '<rootDir>/src/__tests__/e2e/**/*.test.{ts,tsx}',
    '<rootDir>/src/__tests__/integration/**/*.test.{ts,tsx}',
    '<rootDir>/src/__tests__/compatibility/**/*.test.{ts,tsx}',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/__tests__/e2e/setup.ts',
  ],
  testTimeout: 30000, // 30 seconds for E2E tests
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};