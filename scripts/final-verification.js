#!/usr/bin/env node

/**
 * Final deployment verification script
 * Performs comprehensive checks before production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting final deployment verification...\n');

// Verification results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

function checkPassed(message) {
  console.log(`✅ ${message}`);
  results.passed++;
}

function checkFailed(message) {
  console.log(`❌ ${message}`);
  results.failed++;
  results.issues.push(message);
}

function checkWarning(message) {
  console.log(`⚠️  ${message}`);
  results.warnings++;
}

// 1. Check required files
console.log('📋 Checking required files...');
const requiredFiles = [
  'package.json',
  'next.config.mjs',
  'vercel.json',
  'README.md',
  'DEPLOYMENT.md',
  'USER_TESTING.md',
  'src/app/layout.tsx',
  'src/app/page.tsx'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    checkPassed(`Required file exists: ${file}`);
  } else {
    checkFailed(`Missing required file: ${file}`);
  }
});

// 2. Check core components
console.log('\n🧩 Checking core components...');
const coreComponents = [
  'src/components/MainLayout.tsx',
  'src/components/InputSection.tsx',
  'src/components/ResultsDisplay.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/PerformanceMonitor.tsx'
];

coreComponents.forEach(component => {
  if (fs.existsSync(component)) {
    checkPassed(`Core component exists: ${path.basename(component)}`);
  } else {
    checkFailed(`Missing core component: ${component}`);
  }
});

// 3. Check core libraries
console.log('\n📚 Checking core libraries...');
const coreLibs = [
  'src/lib/geohash-decoder.ts',
  'src/lib/coordinate-converter.ts',
  'src/lib/conversion-engine.ts',
  'src/lib/batch-processor.ts',
  'src/lib/input-validator.ts'
];

coreLibs.forEach(lib => {
  if (fs.existsSync(lib)) {
    checkPassed(`Core library exists: ${path.basename(lib)}`);
  } else {
    checkFailed(`Missing core library: ${lib}`);
  }
});

// 4. Check test files
console.log('\n🧪 Checking test coverage...');
const testDirs = [
  'src/__tests__/unit',
  'src/__tests__/integration',
  'src/__tests__/e2e',
  'src/__tests__/performance',
  'src/__tests__/compatibility'
];

testDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    if (files.length > 0) {
      checkPassed(`Test directory has files: ${dir} (${files.length} files)`);
    } else {
      checkWarning(`Test directory is empty: ${dir}`);
    }
  } else {
    checkWarning(`Test directory missing: ${dir}`);
  }
});

// 5. Check package.json configuration
console.log('\n📦 Checking package.json configuration...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check required scripts
  const requiredScripts = [
    'dev', 'build', 'start', 'lint', 'test',
    'deploy:check', 'deploy:preview', 'deploy:production'
  ];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      checkPassed(`Script exists: ${script}`);
    } else {
      checkFailed(`Missing script: ${script}`);
    }
  });
  
  // Check dependencies
  if (packageJson.dependencies && packageJson.dependencies.next) {
    checkPassed('Next.js dependency found');
  } else {
    checkFailed('Next.js dependency missing');
  }
  
  if (packageJson.dependencies && packageJson.dependencies.react) {
    checkPassed('React dependency found');
  } else {
    checkFailed('React dependency missing');
  }
  
} catch (error) {
  checkFailed('Failed to parse package.json');
}

// 6. Check Vercel configuration
console.log('\n🚀 Checking Vercel configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.buildCommand) {
    checkPassed('Build command configured');
  } else {
    checkWarning('Build command not specified');
  }
  
  if (vercelConfig.framework === 'nextjs') {
    checkPassed('Framework set to Next.js');
  } else {
    checkWarning('Framework not set to Next.js');
  }
  
  if (vercelConfig.headers && vercelConfig.headers.length > 0) {
    checkPassed('Security headers configured');
  } else {
    checkWarning('Security headers not configured');
  }
  
} catch (error) {
  checkFailed('Failed to parse vercel.json');
}

// 7. Check documentation
console.log('\n📖 Checking documentation...');
try {
  const readme = fs.readFileSync('README.md', 'utf8');
  
  if (readme.includes('## 功能特性')) {
    checkPassed('README has features section');
  } else {
    checkWarning('README missing features section');
  }
  
  if (readme.includes('## 使用说明')) {
    checkPassed('README has usage instructions');
  } else {
    checkWarning('README missing usage instructions');
  }
  
  if (readme.includes('## 部署')) {
    checkPassed('README has deployment section');
  } else {
    checkWarning('README missing deployment section');
  }
  
} catch (error) {
  checkWarning('Failed to read README.md');
}

// 8. Check environment configuration
console.log('\n🔧 Checking environment configuration...');
if (fs.existsSync('.env.example')) {
  checkPassed('Environment example file exists');
} else {
  checkWarning('Environment example file missing');
}

// 9. Check build configuration
console.log('\n⚙️  Checking build configuration...');
if (fs.existsSync('next.config.mjs')) {
  checkPassed('Next.js config file exists');
} else {
  checkFailed('Next.js config file missing');
}

if (fs.existsSync('tailwind.config.ts')) {
  checkPassed('Tailwind config file exists');
} else {
  checkWarning('Tailwind config file missing');
}

if (fs.existsSync('tsconfig.json')) {
  checkPassed('TypeScript config file exists');
} else {
  checkFailed('TypeScript config file missing');
}

// 10. Final summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

if (results.failed > 0) {
  console.log('\n🚨 CRITICAL ISSUES FOUND:');
  results.issues.forEach(issue => {
    console.log(`   • ${issue}`);
  });
  console.log('\n❌ Deployment verification FAILED');
  console.log('Please fix the critical issues before deploying to production.');
  process.exit(1);
} else if (results.warnings > 0) {
  console.log('\n⚠️  Some warnings found, but deployment can proceed.');
  console.log('Consider addressing warnings for optimal production setup.');
} else {
  console.log('\n🎉 All checks passed!');
}

console.log('\n✅ Deployment verification COMPLETED');
console.log('🚀 Ready for production deployment!');

// Generate verification report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    passed: results.passed,
    failed: results.failed,
    warnings: results.warnings
  },
  status: results.failed === 0 ? 'READY' : 'BLOCKED',
  issues: results.issues
};

fs.writeFileSync('deployment-verification-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Verification report saved to: deployment-verification-report.json');