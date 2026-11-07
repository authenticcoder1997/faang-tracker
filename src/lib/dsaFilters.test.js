import test from 'node:test';
import assert from 'node:assert/strict';
import { filterDsaProblems } from './dsaFilters.js';

const problems = [
  { id: '1', title: 'Climbing stairs', section: 'Dynamic Programming', difficulty: 'Easy', completed: true },
  { id: '2', title: 'Edit distance', section: 'Dynamic Programming', difficulty: 'Hard', completed: false },
  { id: '3', title: 'Flood fill', section: 'Graphs', difficulty: 'Medium', completed: true },
  { id: '4', title: 'Word ladder', section: 'Graphs', difficulty: 'Hard', completed: false },
  { id: '5', title: 'Two Sum', section: 'Arrays & Hashing', difficulty: 'Easy', completed: true },
];
const filters = { query: '', statuses: [], patterns: [], difficulties: [] };
const ids = (selected) => filterDsaProblems(problems, { ...filters, ...selected }).map((item) => item.id);

test('multiple patterns match any selected pattern; status narrows the combined set', () => {
  const patterns = ['Dynamic Programming', 'Graphs'];
  assert.deepEqual(ids({ patterns }), ['1', '2', '3', '4']);
  assert.deepEqual(ids({ patterns, statuses: ['Unsolved'] }), ['2', '4']);
  assert.deepEqual(ids({ patterns, statuses: ['Solved'] }), ['1', '3']);
  assert.deepEqual(ids({ patterns, statuses: ['Solved', 'Unsolved'] }), ['1', '2', '3', '4']);
});

test('difficulty and search further narrow the selection, and clearing shows all rows', () => {
  assert.deepEqual(ids({ query: '  GrAPhS ', difficulties: ['Medium', 'Easy'] }), ['3']);
  assert.deepEqual(ids({ query: 'Edit DISTANCE', patterns: ['Dynamic Programming'], statuses: ['Solved'] }), []);
  assert.deepEqual(ids({}), ['1', '2', '3', '4', '5']);
});
