import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTimerState,
  createWorkoutIntervals,
  pauseTimer,
  restartTimer,
  skipInterval,
  startTimer,
  syncTimer,
} from './workoutEngine.mjs';

test('builds one ordered circuit per round and skips rest after the final exercise', () => {
  const intervals = createWorkoutIntervals(2, 2, 40, 20);
  assert.deepEqual(intervals.map(({ kind, exerciseIndex, round }) => [kind, exerciseIndex, round]), [
    ['work', 0, 1], ['rest', 1, 1], ['work', 1, 1],
    ['rest', 0, 2], ['work', 0, 2], ['rest', 1, 2], ['work', 1, 2],
  ]);
  assert.equal(intervals.at(-1).kind, 'work');
});

test('omits rest intervals when rest is set to zero', () => {
  const intervals = createWorkoutIntervals(2, 2, 30, 0);
  assert.equal(intervals.length, 4);
  assert.ok(intervals.every(({ kind }) => kind === 'work'));
});

test('catches up across multiple intervals using deadlines after a delayed update', () => {
  const intervals = createWorkoutIntervals(2, 1, 10, 5);
  const started = startTimer(createTimerState(intervals), 1000);
  const caughtUp = syncTimer(started, 23000);
  assert.equal(caughtUp.intervalIndex, 2);
  assert.equal(caughtUp.status, 'running');
  assert.equal(caughtUp.remainingMs, 3000);
});

test('pause and resume preserve remaining time', () => {
  const intervals = createWorkoutIntervals(1, 2, 40, 20);
  const started = startTimer(createTimerState(intervals), 1000);
  const paused = pauseTimer(started, 16000);
  assert.equal(paused.status, 'paused');
  assert.equal(paused.remainingMs, 25000);
  const resumed = startTimer(paused, 50000);
  assert.equal(resumed.deadlineMs, 75000);
});

test('skipping advances to the next interval and restart returns to the beginning', () => {
  const intervals = createWorkoutIntervals(2, 1, 40, 20);
  const started = startTimer(createTimerState(intervals), 1000);
  const skipped = skipInterval(started, 5000);
  assert.equal(skipped.intervalIndex, 1);
  assert.equal(skipped.deadlineMs, 25000);
  const restarted = restartTimer(skipped);
  assert.equal(restarted.status, 'ready');
  assert.equal(restarted.intervalIndex, 0);
  assert.equal(restarted.remainingMs, 40000);
});

test('finishes exactly at the last work deadline without a trailing rest', () => {
  const intervals = createWorkoutIntervals(1, 1, 10, 20);
  const started = startTimer(createTimerState(intervals), 1000);
  const finished = syncTimer(started, 11000);
  assert.equal(finished.status, 'finished');
  assert.equal(finished.remainingMs, 0);
  assert.equal(finished.deadlineMs, null);
});
