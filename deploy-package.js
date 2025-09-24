#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Creating optimized deployment package...');

// Create deployment directory
const deployDir = 'deploy-package';
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir);

console.log('📦 Building React app...');
try {
  execSync('cd client && npm run build', { stdio: 'inherit' });
  console.log('✅ React build completed');
} catch (error) {
  console.error('❌ React build failed:', error.message);
  process.exit(1);
}

console.log('📁 Copying server files...');
// Copy server files
const serverFiles = [
  'server/index.js',
  'server/package.json',
  'server/package-lock.json',
  'server/routes'
];

serverFiles.forEach(file => {
  const srcPath = file;
  const destPath = path.join(deployDir, file);
  
  if (fs.existsSync(srcPath)) {
    if (fs.statSync(srcPath).isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
    console.log(`  ✅ Copied ${file}`);
  } else {
    console.log(`  ⚠️  Skipped ${file} (not found)`);
  }
});

console.log('📁 Copying client build...');
// Copy client build
fs.cpSync('client/build', path.join(deployDir, 'client/build'), { recursive: true });
console.log('  ✅ Copied client/build');

console.log('📁 Copying root files...');
// Copy essential root files
const rootFiles = [
  'package.json',
  'package-lock.json',
  'startup.txt'
];

rootFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(deployDir, file));
    console.log(`  ✅ Copied ${file}`);
  }
});

console.log('📦 Creating deployment zip...');
try {
  execSync(`cd ${deployDir} && zip -r ../deployment.zip .`, { stdio: 'inherit' });
  console.log('✅ Deployment zip created: deployment.zip');
} catch (error) {
  console.error('❌ Failed to create zip:', error.message);
  process.exit(1);
}

console.log('🧹 Cleaning up...');
fs.rmSync(deployDir, { recursive: true, force: true });

console.log('🎉 Deployment package ready!');
console.log('📦 File: deployment.zip');
console.log('📏 Size:', (fs.statSync('deployment.zip').size / 1024 / 1024).toFixed(2), 'MB');
