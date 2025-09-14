#!/usr/bin/env node

/**
 * 端到端测试运行脚本
 * 运行完整的端到端测试套件，包括性能和兼容性测试
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const runCommand = (command, description) => {
  log(`\n${colors.blue}▶ ${description}${colors.reset}`);
  log(`${colors.cyan}Running: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    log(`${colors.green}✓ ${description} completed successfully${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}✗ ${description} failed${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
};

const checkPrerequisites = () => {
  log(`${colors.bright}Checking prerequisites...${colors.reset}`);
  
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    log(`${colors.yellow}⚠ node_modules not found. Installing dependencies...${colors.reset}`);
    if (!runCommand('npm install', 'Installing dependencies')) {
      return false;
    }
  }
  
  // Check if required test files exist
  const requiredFiles = [
    'src/__tests__/e2e/conversion-workflow.test.tsx',
    'src/__tests__/integration/ui-interactions.test.tsx',
    'src/__tests__/compatibility/browser-compatibility.test.ts',
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`${colors.red}✗ Required test file not found: ${file}${colors.reset}`);
      return false;
    }
  }
  
  log(`${colors.green}✓ All prerequisites met${colors.reset}`);
  return true;
};

const runTestSuite = (suiteName, pattern, description) => {
  log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.magenta}${colors.bright}${suiteName}${colors.reset}`);
  log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  
  const command = `npx jest --testPathPattern="${pattern}" --verbose --coverage --coverageDirectory=coverage/${suiteName.toLowerCase().replace(/\s+/g, '-')}`;
  return runCommand(command, description);
};

const generateTestReport = () => {
  log(`\n${colors.blue}Generating test report...${colors.reset}`);
  
  const reportDir = 'test-reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(reportDir, `e2e-test-report-${timestamp}.md`);
  
  const report = `# End-to-End Test Report

Generated: ${new Date().toLocaleString()}

## Test Suites

### 1. Conversion Workflow Tests
- **Purpose**: Test complete conversion workflows from input to results
- **Coverage**: Single conversion, batch conversion, error handling
- **Location**: \`src/__tests__/e2e/conversion-workflow.test.tsx\`

### 2. UI Interactions Tests
- **Purpose**: Test component interactions and integration
- **Coverage**: Input validation, result display, progress tracking
- **Location**: \`src/__tests__/integration/ui-interactions.test.tsx\`

### 3. Browser Compatibility Tests
- **Purpose**: Test cross-browser compatibility and feature detection
- **Coverage**: Chrome, Firefox, Safari, Edge, IE11 compatibility
- **Location**: \`src/__tests__/compatibility/browser-compatibility.test.ts\`

## Performance Benchmarks

### Batch Processing Performance
- Small batches (< 100 items): Should complete in < 1 second
- Medium batches (100-1000 items): Should complete in < 5 seconds
- Large batches (> 1000 items): Should use optimized processing

### Memory Usage
- Single conversion: < 1MB memory usage
- Batch conversion: Memory usage should scale linearly
- Large batches: Should use chunked processing to limit memory

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge): Full feature support
- Legacy browsers (IE11): Core functionality with graceful degradation

## Test Coverage Requirements

- **Branches**: > 70%
- **Functions**: > 70%
- **Lines**: > 70%
- **Statements**: > 70%

## Running Tests

\`\`\`bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npx jest --testPathPattern="conversion-workflow"
npx jest --testPathPattern="ui-interactions"
npx jest --testPathPattern="browser-compatibility"

# Run with coverage
npx jest --coverage --testPathPattern="e2e|integration|compatibility"
\`\`\`

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in jest configuration
2. **Memory issues**: Use smaller batch sizes in tests
3. **Browser compatibility**: Check feature detection and fallbacks

### Environment Setup

Ensure the following are installed:
- Node.js >= 14
- npm >= 6
- All project dependencies (\`npm install\`)
`;

  fs.writeFileSync(reportFile, report);
  log(`${colors.green}✓ Test report generated: ${reportFile}${colors.reset}`);
};

const main = async () => {
  log(`${colors.bright}${colors.cyan}GeoHash Converter - End-to-End Test Suite${colors.reset}`);
  log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  let allTestsPassed = true;
  
  // Run test suites
  const testSuites = [
    {
      name: 'Conversion Workflow Tests',
      pattern: 'conversion-workflow',
      description: 'Running end-to-end conversion workflow tests',
    },
    {
      name: 'UI Interactions Tests',
      pattern: 'ui-interactions',
      description: 'Running UI component interaction tests',
    },
    {
      name: 'Browser Compatibility Tests',
      pattern: 'browser-compatibility',
      description: 'Running cross-browser compatibility tests',
    },
  ];
  
  for (const suite of testSuites) {
    const success = runTestSuite(suite.name, suite.pattern, suite.description);
    if (!success) {
      allTestsPassed = false;
    }
  }
  
  // Run all optimized batch processor tests
  if (!runTestSuite(
    'Batch Processing Optimization Tests',
    'optimized-batch-processor',
    'Running batch processing optimization tests'
  )) {
    allTestsPassed = false;
  }
  
  // Generate comprehensive coverage report
  log(`\n${colors.blue}Generating comprehensive coverage report...${colors.reset}`);
  runCommand(
    'npx jest --testPathPattern="e2e|integration|compatibility|optimized-batch-processor" --coverage --coverageDirectory=coverage/comprehensive',
    'Generating comprehensive test coverage'
  );
  
  // Generate test report
  generateTestReport();
  
  // Final summary
  log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.magenta}${colors.bright}TEST SUITE SUMMARY${colors.reset}`);
  log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  
  if (allTestsPassed) {
    log(`${colors.green}${colors.bright}✓ All test suites passed successfully!${colors.reset}`);
    log(`${colors.green}The application is ready for production deployment.${colors.reset}`);
  } else {
    log(`${colors.red}${colors.bright}✗ Some test suites failed.${colors.reset}`);
    log(`${colors.red}Please review the test results and fix any issues before deployment.${colors.reset}`);
  }
  
  log(`\n${colors.cyan}Coverage reports available in: coverage/comprehensive${colors.reset}`);
  log(`${colors.cyan}Test report available in: test-reports/${colors.reset}`);
  
  process.exit(allTestsPassed ? 0 : 1);
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`${colors.red}Uncaught Exception: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`${colors.red}Unhandled Rejection at: ${promise}, reason: ${reason}${colors.reset}`);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  log(`${colors.red}Script failed: ${error.message}${colors.reset}`);
  process.exit(1);
});