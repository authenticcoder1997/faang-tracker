import { hldTopics } from '../data/hldTopics.js';
import { lldTopics } from '../data/lldTopics.js';
import { dsaCatalog, dsaSourceFor, DSA_SOURCE_LABELS } from './dsaCatalog.js';
import { allDsaTopics } from './dsaPlan.js';
import { revisionTrack } from './studyRevisions.js';

const dsaById = new Map(dsaCatalog.map((item) => [item.id, item]));
const earlierTufById = new Map(allDsaTopics.map((item) => [item.id, item]));
const designByTrack = {
  lld: new Map(lldTopics.map((item) => [item.id, item])),
  hld: new Map(hldTopics.map((item) => [item.id, item])),
};

export function revisionQuestion(record) {
  const track = revisionTrack(record);
  if (track !== 'dsa') {
    const item = designByTrack[track].get(record.id);
    return item && { title: item.title, url: item.url };
  }
  const item = dsaById.get(record.id);
  const earlierTuf = !item || (record.source === 'tuf' && !item.sources.tuf)
    ? earlierTufById.get(record.id) : undefined;
  const source = earlierTuf ? 'tuf' : item && (item.sources[record.source] ? record.source : dsaSourceFor(item));
  const entry = earlierTuf || item?.sources[source];
  return entry && { title: entry.title, url: entry.url, sourceLabel: DSA_SOURCE_LABELS[source] };
}
