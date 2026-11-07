import { dsaTopics } from '../data/dsaTopics.js';
import { lldTopics } from '../data/lldTopics.js';
import { hldTopics } from '../data/hldTopics.js';
import { concurrencyTopics } from '../data/concurrencyTopics.js';

export function makeResetProgress(previous) {
  return Object.fromEntries(Object.entries({
    dsa: dsaTopics, lld: lldTopics, hld: hldTopics, concurrency: concurrencyTopics,
  }).map(([track, items]) => [track, {
    ...previous[track],
    ...Object.fromEntries(items.map(({ id, completed, note }) => [
      id, { completed: !!completed, note: note || '' },
    ])),
  }]));
}
