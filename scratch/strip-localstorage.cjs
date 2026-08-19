const fs = require('fs');
let src = fs.readFileSync('src/lib/store.ts', 'utf8');

// 1. Remove all saveToLocal(...) call lines
src = src.replace(/[ \t]*saveToLocal\([^;]+\);\r?\n/g, '');

// 2. Replace loadFromLocal with empty array for all CRM data keys in initial state
const keys = ['clients','services','subServices','requiredDocs','assignedServices',
  'bankingEntries','leads','drafts','collaborations','invoices','oneTimeServices','renewals'];
for (const key of keys) {
  const re = new RegExp(`loadFromLocal\\(["']${key}["'],\\s*\\[\\]\\)`, 'g');
  src = src.replace(re, '[]');
}

// 3. Also remove the loadFromLocal calls inside loadSupabaseData fallback block
// (the null-data fallback references localClients etc, which we keep as-is since they now just return [])

fs.writeFileSync('src/lib/store.ts', src, 'utf8');
console.log('Done: removed saveToLocal and replaced loadFromLocal with [] in store.ts');
