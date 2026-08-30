import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n--- Running Flaunch Game Mode QA Harness for Coffee Crawl ---\n');

// Test 1: Contract & Provenance Files
console.log('1. Checking Contract & Provenance Files:');
assert(existsSync(resolve(rootDir, 'port.json')), 'port.json exists');
assert(existsSync(resolve(rootDir, 'AGENTS.md')), 'AGENTS.md exists');
assert(existsSync(resolve(rootDir, 'vite.config.ts')), 'vite.config.ts exists');

const portContent = JSON.parse(readFileSync(resolve(rootDir, 'port.json'), 'utf8'));
assert(Boolean(portContent.upstream), `port.json defines upstream: ${portContent.upstream}`);

const viteContent = readFileSync(resolve(rootDir, 'vite.config.ts'), 'utf8');
assert(viteContent.includes("base: './'"), "vite.config.ts specifies base: './'");

// Test 2: DOM Contract
console.log('\n2. Checking DOM Elements & Contracts:');
const htmlContent = readFileSync(resolve(rootDir, 'index.html'), 'utf8');
assert(htmlContent.includes('data-gm-timer'), 'index.html has data-gm-timer element');
assert(htmlContent.includes('data-gm-practice'), 'index.html has data-gm-practice element');
assert(htmlContent.includes('id="game-container"'), 'index.html has #game-container canvas mount');

// Test 3: Pure Economy Rules
console.log('\n3. Testing Pure Economy Rules (rules.ts):');
const { createInitialEconomyState, validateAndApplyClaim } = await import('../src/game/rules.ts');

const state0 = createInitialEconomyState(false);
assert(state0.score === 0 && state0.allocation === 0, 'Initial state has score 0 and allocation 0');

// Claim 1: Normal bean (+1 point)
const now1 = 10000;
const { state: state1, result: res1 } = validateAndApplyClaim(state0, 1, now1, true);
assert(res1.success === true && state1.score === 1, 'Claim 1 (+1 pt) succeeds with score = 1');

// Claim 2: Too fast claim (attempted 200ms after previous, minimum is 800ms)
const now2 = 10200;
const { result: res2 } = validateAndApplyClaim(state1, 5, now2, true);
assert(res2.success === false && res2.reason === 'too_fast', 'Rapid claim is rejected with reason: too_fast');

// Claim 3: Valid claim after rate-limit cooldown
const now3 = 11000;
const { state: state3, result: res3 } = validateAndApplyClaim(state1, 50, now3, true);
assert(res3.success === true && state3.score === 51, 'Honey bean (+50 pts) after cooldown succeeds with score = 51');

// Claim 4: Practice mode test
const practiceState0 = createInitialEconomyState(true);
const { state: pState1, result: pRes1 } = validateAndApplyClaim(practiceState0, 10, now1, true);
assert(pRes1.success === true && pState1.allocation === 0, 'Practice mode gives 0 real allocation');

// Claim 5: Ceiling limit clamp
let ceilingState = { ...state3, score: 9990 };
const { state: maxState, result: maxRes } = validateAndApplyClaim(ceilingState, 50, now3 + 2000, true);
assert(maxRes.success === true && maxState.score === 10000, 'Score is properly capped at maxGamePoints = 10000');

console.log(`\nQA Results: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('🎉 ALL QA ASSERTIONS GREEN!\n');
  process.exit(0);
} else {
  console.error('❌ SOME QA ASSERTIONS FAILED.\n');
  process.exit(1);
}
