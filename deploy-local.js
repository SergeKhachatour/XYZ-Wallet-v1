#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Creating local deployment package...');

// Kill any existing processes on ports 3000 and 5000
try {
  console.log('🔄 Stopping existing processes...');
  execSync('npx kill-port 3000 5000', { stdio: 'ignore' });
} catch (error) {
  // Ignore errors if ports are not in use
}

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

console.log('📁 Creating optimized deployment structure...');

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
  }
});

// Copy client build
fs.cpSync('client/build', path.join(deployDir, 'client/build'), { recursive: true });
console.log('  ✅ Copied client/build');

// Copy root files
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

// Create web.config for Azure
const webConfig = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server/index.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server/index.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="client/build{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server/index.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>`;

fs.writeFileSync(path.join(deployDir, 'web.config'), webConfig);
console.log('  ✅ Created web.config');

console.log('📦 Creating deployment zip...');
try {
      // Use PowerShell for Windows compatibility
      execSync(`powershell Compress-Archive -Path "${deployDir}\\*" -DestinationPath "deployment.zip" -Force`, { stdio: 'inherit' });
  console.log('✅ Deployment zip created: deployment.zip');
} catch (error) {
  console.error('❌ Failed to create zip:', error.message);
  process.exit(1);
}

console.log('🧹 Cleaning up...');
fs.rmSync(deployDir, { recursive: true, force: true });

const zipSize = fs.statSync('deployment.zip').size / 1024 / 1024;
console.log('🎉 Deployment package ready!');
console.log('📦 File: deployment.zip');
console.log('📏 Size:', zipSize.toFixed(2), 'MB');
console.log('');
console.log('🚀 To deploy to Azure:');
console.log('1. Go to Azure Portal > App Service > Deployment Center');
console.log('2. Choose "Zip Deploy"');
console.log('3. Upload deployment.zip');
console.log('4. Or use: az webapp deployment source config-zip --resource-group <rg> --name <app> --src deployment.zip');
