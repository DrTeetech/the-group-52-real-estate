const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (entry.name === 'node_modules' || entry.name === '.git') return [];
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const sourceFiles = walk(root).filter((file) => file.endsWith('.js'));

test('all relative CommonJS imports resolve with exact filename casing', () => {
  const missing = [];
  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/require\(["'](\.[^"']+)["']\)/g)) {
      const base = path.resolve(path.dirname(file), match[1]);
      const candidates = [base, `${base}.js`, path.join(base, 'index.js')];
      if (!candidates.some((candidate) => fs.existsSync(candidate))) missing.push(`${path.relative(root, file)} -> ${match[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('auth routes are mounted exactly once', () => {
  const source = fs.readFileSync(path.join(root, 'index.js'), 'utf8');
  const mounts = source.match(/app\.use\(['"]\/api\/auth['"],\s*authRoutes\)/g) || [];
  assert.equal(mounts.length, 1);
});

test('public registration forces the customer role', () => {
  const source = fs.readFileSync(path.join(root, 'controllers/authController.js'), 'utf8');
  assert.match(source, /role:\s*'customer'/);
});

test('property creation starts private and does not spread arbitrary request fields', () => {
  const source = fs.readFileSync(path.join(root, 'controllers/propertyController.js'), 'utf8');
  assert.match(source, /data\.status\s*=\s*'draft'/);
  assert.match(source, /data\.visibility\s*=\s*'private'/);
  assert.doesNotMatch(source, /Property\.create\(\s*\{\s*\.\.\.req\.body/);
});

test('Paystack webhook verifies an HMAC signature and payment amount server-side', () => {
  const source = fs.readFileSync(path.join(root, 'controllers/paymentController.js'), 'utf8');
  assert.match(source, /createHmac\('sha512'/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /amountMinor !== expectedMinor/);
});
