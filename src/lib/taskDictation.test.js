import test from 'node:test';
import assert from 'node:assert/strict';
import { createTaskDictation } from './taskDictation.js';

function harness(options = {}) {
  const instances = [];
  const transcripts = [];
  const statuses = [];
  const errors = [];
  class FakeRecognition {
    constructor() {
      instances.push(this);
      this.starts = 0;
      this.stops = 0;
      this.aborts = 0;
    }
    start() {
      this.starts += 1;
    }
    stop() {
      this.stops += 1;
    }
    abort() {
      this.aborts += 1;
    }
    result(segments, resultIndex = 0) {
      this.onresult?.({
        resultIndex,
        results: segments.map(([transcript, isFinal]) =>
          Object.assign([{ transcript }], { isFinal }),
        ),
      });
    }
  }
  const controller = createTaskDictation({
    Recognition: FakeRecognition,
    language: 'en-IN',
    onTranscript: (transcript) => transcripts.push(transcript),
    onStatus: (status) => statuses.push(status),
    onError: (error) => errors.push(error),
    ...options,
  });
  return { controller, instances, transcripts, statuses, errors };
}

test('recognition starts explicitly, applies language, and blocks repeated starts', () => {
  const { controller, instances, statuses } = harness();
  assert.equal(instances.length, 0);
  assert.equal(controller.start({ field: 'title' }), true);
  const recognition = instances[0];
  assert.equal(recognition.lang, 'en-IN');
  assert.equal(recognition.continuous, true);
  assert.equal(recognition.interimResults, true);
  assert.equal(controller.start({ field: 'notes' }), false);
  assert.equal(instances.length, 1);
  assert.deepEqual(statuses, [{ status: 'starting', field: 'title' }]);
  recognition.onstart();
  assert.deepEqual(statuses.at(-1), { status: 'listening', field: 'title' });
  controller.cancel();
});

test('cumulative final and interim segments replace previews without duplication', () => {
  const { controller, instances, transcripts } = harness();
  controller.start({
    field: 'title',
    baseValue: 'Remember to',
    maxLength: 200,
  });
  const recognition = instances[0];
  recognition.result([['buy', false]]);
  recognition.result(
    [
      ['buy milk', true],
      ['and', false],
    ],
    1,
  );
  recognition.result(
    [
      ['buy milk', true],
      ['and eggs', false],
    ],
    1,
  );
  recognition.result(
    [
      ['buy milk', true],
      ['and eggs', true],
    ],
    1,
  );
  assert.deepEqual(
    transcripts.map(({ value }) => value),
    [
      'Remember to buy',
      'Remember to buy milk and',
      'Remember to buy milk and eggs',
      'Remember to buy milk and eggs',
    ],
  );
  assert.equal(
    transcripts.every(({ truncated }) => !truncated),
    true,
  );
  controller.cancel();
});

test('dictation appends to notes without replacing existing whitespace or text', () => {
  const { controller, instances, transcripts } = harness();
  controller.start({
    field: 'notes',
    baseValue: 'First line\n',
    maxLength: 2000,
  });
  instances[0].result([
    ['  Second  line  ', true],
    ['with details', false],
  ]);
  assert.deepEqual(transcripts.at(-1), {
    field: 'notes',
    value: 'First line\nSecond line with details',
    truncated: false,
  });
  controller.cancel();
});

test('stop waits for the final result and end before another session can start', () => {
  const { controller, instances, transcripts, statuses } = harness();
  controller.start({ field: 'title' });
  const recognition = instances[0];
  recognition.onstart();
  recognition.result([['buy mil', false]]);
  controller.stop();
  controller.stop();
  assert.equal(recognition.stops, 1);
  assert.equal(controller.start({ field: 'notes' }), false);
  recognition.onstart();
  assert.deepEqual(statuses.at(-1), { status: 'stopping', field: 'title' });
  recognition.result([['buy milk', true]]);
  assert.equal(transcripts.at(-1).value, 'buy milk');
  recognition.onend();
  assert.deepEqual(statuses.at(-1), { status: 'idle', field: null });
  assert.equal(controller.start({ field: 'notes' }), true);
  controller.cancel();
});

test('field limits cap visible text, report once, and stop recording', () => {
  const { controller, instances, transcripts, errors } = harness();
  controller.start({ field: 'title', baseValue: 'Buy', maxLength: 8 });
  const recognition = instances[0];
  recognition.result([['milk and eggs', false]]);
  recognition.result([['milk and eggs please', true]]);
  assert.deepEqual(transcripts.at(-1), {
    field: 'title',
    value: 'Buy milk',
    truncated: true,
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /8-character limit/);
  assert.equal(recognition.stops, 1);
  recognition.onend();
});

test('missing support and constructor or start failures leave the controller idle', () => {
  const unsupported = harness({ Recognition: undefined });
  assert.equal(unsupported.controller.start({ field: 'title' }), false);
  assert.match(unsupported.errors[0], /not supported/);

  const constructorFailure = harness({
    Recognition: class {
      constructor() {
        throw new Error('Unavailable');
      }
    },
  });
  assert.equal(constructorFailure.controller.start({ field: 'title' }), false);
  assert.deepEqual(constructorFailure.statuses.at(-1), {
    status: 'idle',
    field: null,
  });
  assert.match(constructorFailure.errors[0], /could not start/);

  const startFailure = harness({
    Recognition: class {
      start() {
        throw Object.assign(new Error('Denied'), { name: 'NotAllowedError' });
      }
      abort() {}
    },
  });
  assert.equal(startFailure.controller.start({ field: 'title' }), false);
  assert.match(startFailure.errors[0], /denied/);
  assert.deepEqual(startFailure.statuses.at(-1), {
    status: 'idle',
    field: null,
  });
});

test('browser errors release audio, retain captured text, and explain recovery', () => {
  for (const [error, expected] of [
    ['not-allowed', /denied/],
    ['no-speech', /No speech/],
    ['audio-capture', /No microphone/],
    ['network', /connection/],
    ['service-not-allowed', /blocked speech recognition/],
    ['language-not-supported', /language/],
    ['unknown', /unexpectedly/],
  ]) {
    const { controller, instances, transcripts, statuses, errors } = harness();
    controller.start({ field: 'title' });
    const recognition = instances[0];
    recognition.result([['Captured draft', false]]);
    recognition.onerror({ error });
    assert.equal(recognition.aborts, 1);
    assert.equal(transcripts.at(-1).value, 'Captured draft');
    assert.deepEqual(statuses.at(-1), { status: 'idle', field: null });
    assert.match(errors.at(-1), expected);
    assert.equal(recognition.onresult, null);
    controller.dispose();
  }
});

test('stop failures release audio and preserve the visible draft', () => {
  const { controller, instances, transcripts, statuses, errors } = harness();
  controller.start({ field: 'title' });
  const recognition = instances[0];
  recognition.result([['Draft', false]]);
  recognition.stop = () => {
    throw new Error('Already stopped');
  };
  controller.stop();
  assert.equal(recognition.aborts, 1);
  assert.equal(transcripts.at(-1).value, 'Draft');
  assert.deepEqual(statuses.at(-1), { status: 'idle', field: null });
  assert.match(errors.at(-1), /could not stop normally/);
});

test('a missing end event triggers bounded cleanup and permits another session', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const { controller, instances, statuses, errors } = harness();
  controller.start({ field: 'title' });
  const recognition = instances[0];
  controller.stop();
  context.mock.timers.tick(1999);
  assert.equal(recognition.aborts, 0);
  context.mock.timers.tick(1);
  assert.equal(recognition.aborts, 1);
  assert.deepEqual(statuses.at(-1), { status: 'idle', field: null });
  assert.match(errors.at(-1), /stopped responding/);
  assert.equal(controller.start({ field: 'notes' }), true);
  controller.cancel();
});

test('cancel and dispose ignore stale callbacks and dispose emits no state updates', () => {
  const { controller, instances, transcripts, statuses, errors } = harness();
  controller.start({ field: 'title' });
  const old = instances[0];
  const staleResult = old.onresult;
  const staleError = old.onerror;
  const staleEnd = old.onend;
  controller.cancel();
  assert.equal(old.aborts, 1);
  assert.equal(
    controller.start({ field: 'notes', baseValue: 'Existing' }),
    true,
  );
  staleResult({ results: [[{ transcript: 'Wrong task' }]] });
  staleError({ error: 'network' });
  staleEnd();
  assert.equal(transcripts.length, 0);
  assert.equal(errors.length, 0);
  assert.deepEqual(statuses.at(-1), { status: 'starting', field: 'notes' });

  const current = instances[1];
  const lateResult = current.onresult;
  const lateStart = current.onstart;
  const statusCount = statuses.length;
  controller.dispose();
  assert.equal(current.aborts, 1);
  lateStart();
  lateResult({ results: [[{ transcript: 'Too late' }]] });
  controller.stop();
  controller.cancel();
  controller.dispose();
  assert.equal(controller.start({ field: 'title' }), false);
  assert.equal(statuses.length, statusCount);
  assert.equal(transcripts.length, 0);
});

test('intentional abort during stop does not produce an error', () => {
  const { controller, instances, errors, statuses } = harness();
  controller.start({ field: 'title' });
  controller.stop();
  instances[0].onerror({ error: 'aborted' });
  assert.equal(errors.length, 0);
  assert.deepEqual(statuses.at(-1), { status: 'idle', field: null });
});
