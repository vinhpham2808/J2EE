#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FORBIDDEN_PATTERNS = [
  {
    pattern: /localStorage\.(setItem|getItem)\(['"]token['"]/g,
    message: 'Direct localStorage token access detected. Use useAuth hook instead.',
    severity: 'high'
  },
  {
    pattern: /sessionStorage\.(setItem|getItem)\(['"]token['"]/g,
    message: 'Direct sessionStorage token access detected. Use useAuth hook instead.',
    severity: 'high'
  },
  {
    pattern: /window\.open\s*\(/g,
    message: 'Direct window.open() detected. Use safeNavigation helper instead.',
    severity: 'medium'
  },
  {
    pattern: /window\.(location\.(href|assign|replace)|location\s*=)/g,
    message: 'Direct window.location navigation detected. Use React Router navigate() instead.',
    severity: 'medium'
  }
];

const EXCLUDE_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage'
];

const EXCLUDE_FILES = [
  'safeNavigation.js',
  'axiosConfig.js',
  'axiosConfig.jsx',
  'security-check.js'
];

let hasErrors = false;
let errorCount = 0;

function shouldExclude(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return EXCLUDE_DIRS.some(dir => normalized.includes(`/${dir}/`)) ||
         EXCLUDE_FILES.some(file => path.basename(filePath) === file);
}

function scanFile(filePath) {
  if (shouldExclude(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    FORBIDDEN_PATTERNS.forEach(({ pattern, message, severity }) => {
      if (pattern.test(line)) {
        console.log(`\x1b[${severity === 'high' ? '31' : '33'}m[${severity.toUpperCase()}]\x1b[0m ${filePath}:${index + 1}`);
        console.log(`  ${message}`);
        console.log(`  \x1b[90m${line.trim()}\x1b[0m\n`);
        
        if (severity === 'high') hasErrors = true;
        errorCount++;
      }
    });
  });
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  });
}

console.log('\x1b[36m🔍 Scanning for security regressions...\x1b[0m\n');

const srcDir = path.join(__dirname, '..', 'src');
if (!fs.existsSync(srcDir)) {
  console.error('\x1b[31mError: src/ directory not found\x1b[0m');
  process.exit(1);
}

scanDirectory(srcDir);

console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

if (errorCount === 0) {
  console.log('\x1b[32m✓ No security regressions detected\x1b[0m\n');
  process.exit(0);
} else {
  console.log(`Found \x1b[${hasErrors ? '31' : '33'}m${errorCount}\x1b[0m pattern match(es)`);
  
  if (hasErrors) {
    console.log('\x1b[31m✗ High severity issues found. Please fix before committing.\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[33m⚠ Review recommended for medium severity issues\x1b[0m\n');
    process.exit(0);
  }
}
