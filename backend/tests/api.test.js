const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../dist/app');

const lead = (n, extra = {}) => ({ id: `id${n}`, title: `Lead ${n}`, description: 'd', platform: 'Upwork', url: `https://x/${n}`, createdAt: 'now', status: 'new', ...extra });

function boot(overrides = {}) {
  const calls = { workflows: 0 };
  const services = {
    apify: { ingestLeads: async () => [lead(1), lead(2), lead(3)] },
    zynd: { evaluateLead: async (l) => ({ leadId: l.id, score: l.title === 'Lead 1' ? 90 : 40, reasoning: 'r', recommendedAction: 'x', networkLogs: ['log'] }) },
    superplane: { triggerLeadWorkflow: async () => { calls.workflows++; return 'exec_1'; } },
    ...overrides,
  };
  const server = createApp(services).listen(0);
  const base = `http://localhost:${server.address().port}`;
  return { base, calls, close: () => server.close() };
}

test('ingest scores leads, qualifies only those above the threshold, and triggers the workflow once', async () => {
  const { base, calls, close } = boot();
  const r = await (await fetch(`${base}/api/ingest`, { method: 'POST' })).json();
  assert.equal(r.count, 3);
  const leads = await (await fetch(`${base}/api/leads`)).json();
  assert.deepEqual(leads.map((l) => l.status), ['qualified', 'rejected', 'rejected']);
  assert.equal(leads[0].workflowId, 'exec_1');
  assert.equal(calls.workflows, 1);
  close();
});

test('ingesting twice does not duplicate leads', async () => {
  const { base, close } = boot();
  await fetch(`${base}/api/ingest`, { method: 'POST' });
  await fetch(`${base}/api/ingest`, { method: 'POST' });
  assert.equal((await (await fetch(`${base}/api/leads`)).json()).length, 3);
  close();
});

test('one failing lead does not abort the batch or stay stuck as "evaluating"', async () => {
  let n = 0;
  const { base, close } = boot({
    zynd: { evaluateLead: async (l) => { if (++n === 2) throw new Error('boom'); return { leadId: l.id, score: 10, reasoning: 'r', recommendedAction: 'x', networkLogs: [] }; } },
  });
  const r = await (await fetch(`${base}/api/ingest`, { method: 'POST' })).json();
  assert.equal(r.count, 2);
  assert.deepEqual(r.failed, ['Lead 2']);
  const leads = await (await fetch(`${base}/api/leads`)).json();
  assert.equal(leads.length, 2);
  assert.ok(leads.every((l) => l.status === 'rejected'));
  close();
});

test('overlapping ingests are refused with 409', async () => {
  let release;
  const gate = new Promise((res) => { release = res; });
  const { base, close } = boot({ apify: { ingestLeads: async () => { await gate; return []; } } });
  const first = fetch(`${base}/api/ingest`, { method: 'POST' });
  await new Promise((r) => setTimeout(r, 50));
  assert.equal((await fetch(`${base}/api/ingest`, { method: 'POST' })).status, 409);
  release();
  assert.equal((await first).status, 200);
  close();
});

test('CORS only allows configured origins', async () => {
  const { base, close } = boot();
  const ok = await fetch(`${base}/api/leads`, { headers: { Origin: 'http://localhost:3000' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  const evil = await fetch(`${base}/api/leads`, { headers: { Origin: 'https://evil.example' } });
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
  close();
});
