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
      // Find matching closing of useEffect
      let depth = 0;
      let startIdx = idx;
      let fullCall = '';
      for (let j = idx; j < Math.min(lines.length, idx + 100); j++) {
        fullCall += lines[j] + '\n';
        for (const char of lines[j]) {
          if (char === '(') depth++;
          if (char === ')') depth--;
        }
        if (depth === 0) {
          // Check if this fullCall has a dependency array argument
          const trimmed = fullCall.trim();
          // Heuristic: does it end with `}, [...]);` or `}, []);` or `});` ?
          if (/,\s*\[[^\]]*\]\s*\);?\s*$/.test(trimmed)) {
            // has deps
          } else {
            console.log(`[NO/MALFORMED DEPS] in ${file}:${idx + 1}`);
            console.log(trimmed.slice(-100));
            console.log('---');
          }
          break;
        }
      }
    }
  }
});
