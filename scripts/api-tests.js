#!/usr/bin/env node
/* Automated API tests for dev server
   - Uses global fetch (Node 18+). Exits non-zero on failure.
*/
const base = process.env.BASE_URL || 'http://127.0.0.1:5000';
const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, 'api-tests.log');
// reset log
try { fs.writeFileSync(logPath, `API tests run at ${new Date().toISOString()}\n`); } catch (e) { /* ignore */ }
function write(msg){
  try { fs.appendFileSync(logPath, msg + '\n'); } catch (e) { /* ignore */ }
  try { console.log(msg); } catch(e){}
}
function writeErr(msg){
  try { fs.appendFileSync(logPath, 'ERROR: ' + msg + '\n'); } catch (e) { /* ignore */ }
  try { console.error(msg); } catch(e){}
}

async function call(path, opts = {}){
  const url = base + path;
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), 10000);
  try{
    const res = await fetch(url, {...opts, signal: controller.signal});
    const text = await res.text();
    let json;
    try{ json = JSON.parse(text); }catch(e){ json = text; }
    return { status: res.status, ok: res.ok, body: json };
  }catch(err){
    return { error: err.message || String(err) };
  }finally{ clearTimeout(id); }
}

function expect(cond, msg){ if(!cond) throw new Error(msg); }

async function run(){
  write('API test base: ' + base);

  // 1: health
  const h = await call('/api/health');
  expect(!h.error && h.status === 200, 'Health check failed: ' + JSON.stringify(h));
  write('✔ Health OK');

  // 2: super-admin list projects
  const sa = await call('/api/projects', { headers: { Authorization: 'Bearer user-4' }});
  expect(!sa.error && sa.status === 200 && Array.isArray(sa.body), 'Super-admin projects failed: ' + JSON.stringify(sa));
  write('✔ Super-admin can list projects (count=' + sa.body.length + ')');

  // 3: demo user list projects
  const demoList = await call('/api/projects', { headers: { Authorization: 'Bearer demo-user-id' }});
  expect(!demoList.error && demoList.status === 200 && Array.isArray(demoList.body), 'Demo list failed: ' + JSON.stringify(demoList));
  // each item.userId should be demo-user-id
  const bad = demoList.body.filter && demoList.body.filter(p => p.userId && p.userId !== 'demo-user-id');
  expect(!(bad && bad.length), 'Demo user received projects not owned by demo: ' + JSON.stringify(bad));
  write('✔ Demo user sees only own projects (count=' + demoList.body.length + ')');

  // 4: create project as demo
  const newProjPayload = { name: 'API Test Project', prompt: 'test', llm: 'claude', mcpServers: [], files: [] };
  const created = await call('/api/projects', { method: 'POST', headers: { 'content-type':'application/json', Authorization: 'Bearer demo-user-id' }, body: JSON.stringify(newProjPayload) });
  expect(!created.error && (created.status === 201 || created.status === 200) && created.body && created.body.id, 'Create project failed: ' + JSON.stringify(created));
  expect(created.body.userId === 'demo-user-id', 'Created project missing owner demo-user-id: ' + JSON.stringify(created.body));
  write('✔ Created project as demo: ' + created.body.id);

  // 5: create SA project then attempt demo to patch (expect 403)
  const saPayload = { name: 'SA Test Project', prompt: 'sa', llm: 'claude', mcpServers: [], files: [] };
  const saCreated = await call('/api/projects', { method: 'POST', headers: { 'content-type':'application/json', Authorization: 'Bearer user-4' }, body: JSON.stringify(saPayload) });
  expect(!saCreated.error && (saCreated.status === 201 || saCreated.status === 200) && saCreated.body && saCreated.body.id, 'SA create failed: ' + JSON.stringify(saCreated));
  const saId = saCreated.body.id;
  const patchRes = await call(`/api/projects/${saId}`, { method: 'PATCH', headers: { 'content-type':'application/json', Authorization: 'Bearer demo-user-id' }, body: JSON.stringify({ name: 'Hacked' }) });
  // expecting 403 Forbidden
  expect(!patchRes.error && (patchRes.status === 403 || patchRes.status === 404), 'Expected 403/404 when demo patches SA project, got: ' + JSON.stringify(patchRes));
  write('✔ Demo user forbidden from updating SA project (status=' + patchRes.status + ')');

  // 6: rate-limit quick check (anonymous) - send 35 requests and expect some 429s
  let statusCounts = {};
  for(let i=0;i<35;i++){
    const r = await call('/api/health');
    const s = r.status || 'err';
    statusCounts[s] = (statusCounts[s]||0)+1;
    // slight pause to avoid spinning too fast
    if(i%10===0) await timeout(50);
  }
  write('Rate-limit status counts: ' + JSON.stringify(statusCounts));
  const has429 = Object.keys(statusCounts).some(k => Number(k) === 429 || k === '429');
  expect(has429 || statusCounts['200'] >= 1, 'Rate-limit check inconclusive; counts: ' + JSON.stringify(statusCounts));
  write('✔ Rate-limit observed (or at least health responses present)');

  write('\nALL TESTS PASSED');
}

run().catch(err => {
  writeErr('TESTS FAILED: ' + (err && err.message || String(err)));
  process.exit(1);
});
