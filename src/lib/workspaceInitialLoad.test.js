import test from 'node:test';
import assert from 'node:assert/strict';
import { needsWorkspaceMigration, receiveWorkspaceSnapshots } from './workspaceInitialLoad.js';

const event = (revision, metadata = {}) => ({
  exists: () => true,
  data: () => ({ revision, importedFirebaseLegacy: true }),
  metadata,
});

test('an already migrated workspace does not need an extra read or legacy transaction', () => {
  const migrated = { importedFirebaseLegacy: true, importedLegacy: ['old-cache'] };
  assert.equal(needsWorkspaceMigration(migrated, null), false);
  assert.equal(needsWorkspaceMigration(migrated, 'old-cache'), false);
  assert.equal(needsWorkspaceMigration(migrated, 'different-cache'), true);
  assert.equal(needsWorkspaceMigration({ importedFirebaseLegacy: false }, null), true);
  assert.equal(needsWorkspaceMigration(undefined, null), true);
});

test('the listener uses one confirmed startup snapshot and ignores cached and pending events', async () => {
  const first = event(3);
  const events = [];
  const receive = receiveWorkspaceSnapshots({
    active: () => true,
    initialize: (snapshot) => { events.push('initialize'); return snapshot; },
    adopt: (snapshot) => events.push(snapshot.data().revision),
    fail: (error) => { throw error; },
    initialized: () => events.push('live'),
  });
  receive(event(1, { fromCache: true }));
  receive(event(2, { hasPendingWrites: true }));
  assert.deepEqual(events, []);
  receive(first);
  await Promise.resolve();
  receive(event(4));
  assert.deepEqual(events, ['initialize', 3, 'live', 4]);
});

test('legacy startup adopts newer confirmed data received during migration', async () => {
  const adopted = [];
  let finish;
  let initializations = 0;
  const migration = new Promise((resolve) => { finish = resolve; });
  const receive = receiveWorkspaceSnapshots({
    active: () => true,
    initialize: () => { initializations++; return migration; },
    adopt: (snapshot) => adopted.push(snapshot.data().revision),
    fail: (error) => { throw error; },
    initialized: (snapshot) => adopted.push(`live:${snapshot.data().revision}`),
  });
  receive(event(1));
  receive(event(3));
  receive(event(4, { hasPendingWrites: true }));
  finish(event(2));
  await migration;
  assert.equal(initializations, 1);
  assert.deepEqual(adopted, [3, 'live:3']);
});

test('disconnecting mid-initialization does not publish stale data', async () => {
  let active = true;
  let finish;
  const migration = new Promise((resolve) => { finish = resolve; });
  const receive = receiveWorkspaceSnapshots({
    active: () => active,
    initialize: () => migration,
    adopt: () => assert.fail('stale data published'),
    fail: () => assert.fail('stale connection reported an error'),
    initialized: () => assert.fail('stale connection initialized'),
  });
  receive(event(1));
  active = false;
  finish(event(2));
  await migration;
});
