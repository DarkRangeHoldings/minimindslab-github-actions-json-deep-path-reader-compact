import { appendFileSync } from 'node:fs';

const payloadRaw = process.env.INPUT_PAYLOAD;
const outputPath = process.env.GITHUB_OUTPUT;

function fail(message) {
  throw new Error(message);
}

if (typeof payloadRaw !== 'string') fail('Invalid input: INPUT_PAYLOAD must be set');
if (typeof outputPath !== 'string' || outputPath.length === 0) fail('Invalid environment: GITHUB_OUTPUT must be set');

let parsed;
try {
  parsed = JSON.parse(payloadRaw);
} catch {
  fail('Invalid input: INPUT_PAYLOAD must be valid JSON');
}

if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) fail('Invalid input: payload must be an object');
if (!Object.prototype.hasOwnProperty.call(parsed, 'value')) fail('Invalid input: payload.value is required');
if (!Object.prototype.hasOwnProperty.call(parsed, 'path')) fail('Invalid input: payload.path is required');

const valueRoot = parsed.value;
const path = parsed.path;

if (valueRoot === null || typeof valueRoot !== 'object' || Array.isArray(valueRoot)) fail('Invalid input: value must be a plain object');
if (typeof path !== 'string' || path.length === 0) fail('Invalid input: path must be a non-empty string');
if (path.includes('..') || path.startsWith('.') || path.endsWith('.')) fail('Invalid input: path format is invalid');

const segmentRe = /^[A-Za-z0-9_-]+$/;
const segments = path.split('.');
for (let i = 0; i < segments.length; i++) {
  if (!segmentRe.test(segments[i])) fail('Invalid input: path segment is invalid');
}

let current = valueRoot;
let exists = true;

for (let i = 0; i < segments.length; i++) {
  const key = segments[i];
  if (current === null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, key)) {
    exists = false;
    current = null;
    break;
  }
  current = current[key];
}

const result = exists ? { exists: true, value: current } : { exists: false, value: null };
appendFileSync(outputPath, `result=${JSON.stringify(result)}\n`);