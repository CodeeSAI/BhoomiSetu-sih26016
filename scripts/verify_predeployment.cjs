// ============================================================
// BhoomiSetu SIH26016 — Final Pre-Deployment Verification Script
// Automated Execution for All Verification Gates
// ============================================================
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

console.log('====================================================');
console.log('BHOOMISETU SIH26016 — FINAL PRE-DEPLOYMENT AUDIT');
console.log('====================================================');

let totalChecks = 0;
let passedChecks = 0;

function runCheck(name, fn) {
  totalChecks++;
  process.stdout.write(`[CHECK ${totalChecks}] ${name}... `);
  try {
    fn();
    passedChecks++;
    console.log('PASSED ✓');
  } catch (err) {
    console.log('FAILED ✗');
    console.error('   ', err.message);
    process.exitCode = 1;
  }
}

// 1. TypeScript Check
runCheck('TypeScript zero-emit validation (tsc --noEmit)', () => {
  execSync('npx tsc --noEmit', { cwd: ROOT_DIR, stdio: 'pipe' });
});

// 2. Production Build Directory Verification
runCheck('Production build dist artifacts exist and are complete', () => {
  const distDir = path.join(ROOT_DIR, 'dist');
  assert(fs.existsSync(distDir), 'dist/ directory does not exist');
  assert(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html does not exist');
  assert(fs.existsSync(path.join(distDir, 'assets')), 'dist/assets directory does not exist');
  
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  assert(indexHtml.includes('BhoomiSetu'), 'dist/index.html missing BhoomiSetu title');
  assert(indexHtml.includes('stylesheet') || indexHtml.includes('index-'), 'dist/index.html missing CSS bundle link');
});

// 3. Secrets & API Keys Check in Source Code
runCheck('Zero API secrets or private tokens in src/', () => {
  const dangerousPatterns = [
    /AIza[0-9A-Za-z-_]{35}/g, // Google API Key
    /sk-[a-zA-Z0-9]{32,}/g,   // OpenAI Secret Key
    /AKIA[0-9A-Z]{16}/g,      // AWS Access Key
    /ghp_[a-zA-Z0-9]{36}/g,   // GitHub Personal Access Token
  ];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx?|jsx?|json|css|html)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of dangerousPatterns) {
          assert(!pattern.test(content), `Found dangerous secret pattern in ${fullPath}`);
        }
      }
    }
  }

  scanDir(SRC_DIR);
});

// 4. .env.example Validation
runCheck('.env.example contains only environment placeholders', () => {
  const envExamplePath = path.join(ROOT_DIR, '.env.example');
  assert(fs.existsSync(envExamplePath), '.env.example missing');
  const envExample = fs.readFileSync(envExamplePath, 'utf-8');
  assert(!envExample.includes('AIza'), '.env.example has real keys');
  assert(!envExample.includes('sk-'), '.env.example has real OpenAI keys');
  assert(envExample.includes('VITE_DILRMP_BASE_URL='), '.env.example missing DILRMP placeholder');
  assert(envExample.includes('VITE_ULPIN_GATEWAY_URL='), '.env.example missing ULPIN placeholder');
  assert(envExample.includes('VITE_PFMS_ENDPOINT='), '.env.example missing PFMS placeholder');
});

// 5. Lorem Ipsum / Placeholder Text Check
runCheck('No Lorem Ipsum or untended dummy placeholder text in src/', () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        assert(!/lorem ipsum/i.test(content), `Found lorem ipsum in ${fullPath}`);
      }
    }
  }
  scanDir(SRC_DIR);
});

// 6. DEMO / Synthetic Data Labels
runCheck('DEMO • SYNTHETIC DATA disclaimers are present in key views', () => {
  const appLayout = fs.readFileSync(path.join(SRC_DIR, 'layouts', 'AppLayout.tsx'), 'utf-8');
  assert(appLayout.includes('DEMO • SYNTHETIC DATA'), 'AppLayout missing DEMO • SYNTHETIC DATA badge');

  const loginPage = fs.readFileSync(path.join(SRC_DIR, 'pages', 'LoginPage.tsx'), 'utf-8');
  assert(loginPage.includes('SYNTHETIC DATA'), 'LoginPage missing SYNTHETIC DATA disclaimer');

  const landingPage = fs.readFileSync(path.join(SRC_DIR, 'pages', 'LandingPage.tsx'), 'utf-8');
  assert(landingPage.includes('Synthetic Data'), 'LandingPage missing Synthetic Data banner');
});

// 7. Vercel SPA Routing Configuration
runCheck('vercel.json is properly configured for Vite SPA deep-links', () => {
  const vercelJsonPath = path.join(ROOT_DIR, 'vercel.json');
  assert(fs.existsSync(vercelJsonPath), 'vercel.json missing');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  assert(vercelConfig.framework === 'vite', 'vercel.json framework is not vite');
  assert(Array.isArray(vercelConfig.rewrites), 'vercel.json rewrites missing');
  assert(vercelConfig.rewrites.some(r => r.destination === '/index.html'), 'vercel.json missing /index.html rewrite');
});

// 8. .gitignore Security
runCheck('.gitignore prevents leaking .env, .local, and node_modules', () => {
  const gitignorePath = path.join(ROOT_DIR, '.gitignore');
  assert(fs.existsSync(gitignorePath), '.gitignore missing');
  const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
  assert(gitignore.includes('node_modules'), '.gitignore missing node_modules');
  assert(gitignore.includes('dist'), '.gitignore missing dist');
  assert(gitignore.includes('.env'), '.gitignore missing .env pattern');
});

// 9. GIS Integrity Verification
runCheck('GIS geospatial coordinate integrity (run verify_gis_integrity.cjs)', () => {
  execSync('node scripts/verify_gis_integrity.cjs', { cwd: ROOT_DIR, stdio: 'pipe' });
});

// 10. Authentication & RBAC Verification
runCheck('All 9 User Roles and Demo Accounts match RBAC specification', () => {
  const demoAccounts = fs.readFileSync(path.join(SRC_DIR, 'data', 'demoAccounts.ts'), 'utf-8');
  const roles = [
    'National Administrator',
    'Central Ministry Officer',
    'State Authority',
    'District Collector',
    'Land Acquisition Officer',
    'Project Implementing Agency',
    'Field Verification Officer',
    'R&R Officer',
    'Policy Analyst',
  ];
  for (const r of roles) {
    assert(demoAccounts.includes(r), `Missing role ${r} in demo accounts`);
  }
});

console.log('====================================================');
console.log(`SUMMARY: ${passedChecks}/${totalChecks} PRE-DEPLOYMENT GATES PASSED`);
console.log('====================================================');
