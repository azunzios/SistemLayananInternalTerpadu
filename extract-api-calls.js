#!/usr/bin/env node

/**
 * Script untuk mengekstrak semua API calls dari frontend
 * Mencari pattern: api.get(), api.post(), api.put(), api.patch(), api.delete()
 */

const fs = require('fs');
const path = require('path');

const apiCalls = [];
const fileMap = new Map();

// Fungsi untuk mencari semua file .ts dan .tsx
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (/\.(ts|tsx)$/.test(file) && !file.includes('.d.ts')) {
      callback(filePath);
    }
  });
}

// Fungsi untuk mengekstrak API calls dari file
function extractApiCalls(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Pattern untuk menangkap api.method() calls
  const patterns = [
    /api\.(get|post|put|patch|delete)\s*\(\s*[`'"]([^`'"]+)[`'"]/g,
    /api\.(get|post|put|patch|delete)\s*\(\s*`([^`]+)`/g,
    /api\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g,
  ];

  let match;
  const lines = content.split('\n');
  
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern.source, 'g');
    while ((match = regex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const endpoint = match[2];
      
      // Cari line number
      const index = match.index;
      let lineNum = 1;
      let charCount = 0;
      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1; // +1 for newline
        if (charCount > index) {
          lineNum = i + 1;
          break;
        }
      }
      
      // Extract context (beberapa karakter sebelum dan sesudah)
      const contextStart = Math.max(0, index - 50);
      const contextEnd = Math.min(content.length, index + 100);
      const context = content.substring(contextStart, contextEnd)
        .replace(/\s+/g, ' ')
        .trim();
      
      apiCalls.push({
        method,
        endpoint,
        file: relativePath,
        line: lineNum,
        context
      });
      
      // Group by file
      if (!fileMap.has(relativePath)) {
        fileMap.set(relativePath, []);
      }
      fileMap.get(relativePath).push({ method, endpoint, line: lineNum });
    }
  });
}

// Main execution
console.log('🔍 Mengekstrak API calls dari frontend...\n');

const frontendSrc = path.join(__dirname, 'frontend', 'src');

if (!fs.existsSync(frontendSrc)) {
  console.error('❌ Folder frontend/src tidak ditemukan!');
  process.exit(1);
}

walkDir(frontendSrc, extractApiCalls);

// Sort by endpoint
apiCalls.sort((a, b) => {
  if (a.endpoint !== b.endpoint) return a.endpoint.localeCompare(b.endpoint);
  return a.method.localeCompare(b.method);
});

// Generate report
console.log(`✅ Ditemukan ${apiCalls.length} API calls\n`);
console.log('=' .repeat(80));
console.log('\n📋 RINGKASAN API CALLS\n');

// Group by endpoint and method
const grouped = {};
apiCalls.forEach(call => {
  const key = `${call.method} ${call.endpoint}`;
  if (!grouped[key]) {
    grouped[key] = [];
  }
  grouped[key].push(call);
});

// Print grouped summary
Object.keys(grouped).sort().forEach(key => {
  const calls = grouped[key];
  console.log(`\n${key}`);
  console.log(`  📍 Digunakan di ${calls.length} lokasi:`);
  calls.forEach(call => {
    console.log(`     - ${call.file}:${call.line}`);
  });
});

console.log('\n' + '='.repeat(80));
console.log('\n📊 STATISTIK\n');

// Statistics
const methodCount = {};
apiCalls.forEach(call => {
  methodCount[call.method] = (methodCount[call.method] || 0) + 1;
});

console.log('Jumlah calls per method:');
Object.entries(methodCount).sort((a, b) => b[1] - a[1]).forEach(([method, count]) => {
  console.log(`  ${method.padEnd(7)}: ${count}`);
});

console.log(`\nTotal unique endpoints: ${Object.keys(grouped).length}`);
console.log(`Total API calls: ${apiCalls.length}`);
console.log(`Total files: ${fileMap.size}`);

// Save to JSON
const outputFile = 'frontend-api-calls.json';
fs.writeFileSync(
  outputFile,
  JSON.stringify(
    {
      summary: {
        totalCalls: apiCalls.length,
        uniqueEndpoints: Object.keys(grouped).length,
        totalFiles: fileMap.size,
        methodStats: methodCount,
        generatedAt: new Date().toISOString()
      },
      groupedByEndpoint: grouped,
      allCalls: apiCalls,
      fileMap: Object.fromEntries(fileMap)
    },
    null,
    2
  )
);

console.log(`\n💾 Detail lengkap disimpan ke: ${outputFile}`);
console.log('\n✨ Selesai!');
