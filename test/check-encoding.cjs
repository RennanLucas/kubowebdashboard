const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.html')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('\ufffd')) {
          results.push(file);
        }
      }
    }
  });
  return results;
}

const badSrc = walk('src');
const badSupabase = walk('supabase/functions');
const bad = [...badSrc, ...badSupabase];

if (bad.length > 0) {
  console.error('Encoding error (\ufffd) found in:', bad);
  process.exit(1);
} else {
  console.log('Encoding test passed. No \ufffd characters found.');
}
