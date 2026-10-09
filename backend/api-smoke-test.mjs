// Uses only Node's built-in fetch and assert. Run against an isolated test database.
import assert from 'node:assert/strict';
const base = process.env.TEST_API_URL || 'http://localhost:8081/api';
const suffix = Date.now();
let checks = 0;
async function request(method, path, body, token, expected = 200) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  assert.equal(response.status, expected, method + ' ' + path + ': ' + raw);
  assert.ok(!raw.includes('passwordHash') && !raw.includes('$2a$'), 'No password hashes in responses');
  checks++;
  return raw ? JSON.parse(raw) : null;
}
await request('GET', '/health');
await request('GET', '/vulnerabilities', undefined, undefined, 401);
await request('GET', '/vulnerabilities', undefined, 'forged-token', 401);
const admin = await request('POST', '/auth/login', { email: process.env.TEST_ADMIN_EMAIL || 'admin@cybershield.test', password: process.env.TEST_ADMIN_PASSWORD || 'Local-testing-only-2026!' });
const accounts = [];
for (const name of ['Alex Morgan', 'Jordan Lee', 'Casey Patel']) {
  accounts.push(await request('POST', '/auth/register', { name, email: name.split(' ')[0].toLowerCase() + suffix + '@test.example', password: 'Local-test-employee-2026!', role: 'ADMIN' }, undefined, 201));
}
const [reporter, assignee, outsider] = accounts;
assert.equal(reporter.user.role, 'EMPLOYEE');
await request('GET', '/admin/employees', undefined, reporter.token, 403);
let finding = await request('POST', '/vulnerabilities', { title: 'Missing object-level authorization on billing API', asset: 'billing.lab.example', category: 'API security', severity: 'HIGH', description: 'Isolated verification fixture: a tenant boundary requires review.', steps: 'Review ownership checks on the authorized laboratory endpoint.', remediation: 'Enforce resource ownership on every request.' }, reporter.token, 201);
assert.equal(finding.reporter.id, reporter.user.id);
await request('GET', '/vulnerabilities/' + finding.id, undefined, outsider.token, 403);
await request('GET', '/activity/finding/' + finding.id, undefined, outsider.token, 403);
assert.equal((await request('GET', '/vulnerabilities', undefined, outsider.token)).length, 0);
await request('PATCH', '/vulnerabilities/' + finding.id, { version: finding.version, status: 'CLOSED', severity: finding.severity, assigneeId: null }, reporter.token, 403);
finding = await request('PATCH', '/vulnerabilities/' + finding.id, { version: finding.version, status: 'OPEN', severity: finding.severity, assigneeId: assignee.user.id }, admin.token);
assert.equal(finding.assignee.id, assignee.user.id);
await request('PATCH', '/vulnerabilities/' + finding.id, { version: 999, status: 'OPEN', severity: finding.severity, assigneeId: assignee.user.id }, admin.token, 409);
await request('GET', '/vulnerabilities/' + finding.id, undefined, assignee.token);
finding = await request('PATCH', '/vulnerabilities/' + finding.id, { version: finding.version, status: 'IN_PROGRESS', severity: finding.severity, assigneeId: assignee.user.id }, assignee.token);
await request('POST', '/activity/finding/' + finding.id, { message: 'Reproduction confirmed in the authorized lab.' }, assignee.token, 201);
assert.ok((await request('GET', '/activity/finding/' + finding.id, undefined, reporter.token)).length >= 3);
const taskInput = { title: 'Verify tenant isolation on the billing API', asset: 'billing.lab.example', description: 'Review access checks within the authorized test tenant and record the outcome.', assigneeId: assignee.user.id, vulnerabilityId: finding.id, priority: 'HIGH', dueDate: null };
await request('POST', '/tasks', taskInput, reporter.token, 403);
let task = await request('POST', '/tasks', taskInput, admin.token, 201);
assert.equal(task.assignee.id, assignee.user.id);
await request('GET', '/tasks/' + task.id, undefined, outsider.token, 403);
task = await request('PATCH', '/tasks/' + task.id, { version: task.version, status: 'IN_PROGRESS', result: '', assigneeId: assignee.user.id }, assignee.token);
await request('PATCH', '/tasks/' + task.id, { version: task.version, status: 'IN_REVIEW', result: '', assigneeId: assignee.user.id }, assignee.token, 400);
task = await request('PATCH', '/tasks/' + task.id, { version: task.version, status: 'IN_REVIEW', result: 'Tenant ownership checks verified in the authorized lab.', assigneeId: assignee.user.id }, assignee.token);
await request('PATCH', '/tasks/' + task.id, { version: task.version, status: 'COMPLETED', result: task.result, assigneeId: assignee.user.id }, assignee.token, 400);
task = await request('PATCH', '/tasks/' + task.id, { version: task.version, status: 'COMPLETED', result: task.result, assigneeId: assignee.user.id }, admin.token);
assert.equal(task.status, 'COMPLETED');
finding = await request('PATCH', '/vulnerabilities/' + finding.id, { version: finding.version, status: 'RESOLVED', severity: finding.severity, assigneeId: assignee.user.id }, assignee.token);
finding = await request('PATCH', '/vulnerabilities/' + finding.id, { version: finding.version, status: 'CLOSED', severity: finding.severity, assigneeId: assignee.user.id }, admin.token);
assert.equal(finding.status, 'CLOSED');
await request('PATCH', '/admin/employees/' + outsider.user.id, { active: false }, admin.token);
await request('GET', '/auth/me', undefined, outsider.token, 401);
console.log('PASS: ' + checks + ' database-backed HTTP checks, including full employee/admin lifecycle.');
