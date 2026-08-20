import fs from 'fs';
import path from 'path';

function findFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        findFiles(full, list);
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      list.push(full);
    }
  }
  return list;
}

const files = findFiles('./src');

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf-8');
  const lines = code.split('\n');
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.includes('useEffect(') || line.includes('React.useEffect(')) {
      // Collect whole useEffect
      let depth = 0;
      let fullCall = '';
      for (let j = idx; j < Math.min(lines.length, idx + 100); j++) {
        fullCall += lines[j] + '\n';
        for (const char of lines[j]) {
          if (char === '(') depth++;
          if (char === ')') depth--;
        }
        if (depth === 0) break;
      }
      
      // Look for setters called directly in the body (not inside setInterval/setTimeout/event listener/async callback)
      const callLines = fullCall.split('\n');
      let asyncLevel = 0;
      const syncSetters = [];
      for (const cl of callLines) {
        if (/setTimeout|setInterval|addEventListener|ws\.|socket\.|fetch|\.then|\.catch|requestAnimationFrame/i.test(cl)) {
          asyncLevel++;
        }
        if (asyncLevel === 0) {
          const match = cl.match(/\b(set[A-Z][a-zA-Z0-9_]*)\s*\(/);
          if (match) {
            syncSetters.push(match[1]);
          }
        }
      }

      if (syncSetters.length > 0) {
        // extract dependencies
        const depMatch = fullCall.match(/,\s*\[([^\]]*)\]\s*\);?\s*$/);
        const deps = depMatch ? depMatch[1].trim() : 'NO_DEPS_ARRAY';
        console.log(`FILE: ${file}:${idx + 1}`);
        console.log(`  Setters: ${syncSetters.join(', ')}`);
        console.log(`  Deps: [${deps}]`);
        console.log('---');
      }
    }
  }
});
