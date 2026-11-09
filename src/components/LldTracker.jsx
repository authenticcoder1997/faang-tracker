import { useCloudStorage } from '../hooks/useCloudStorage';
import { lldTopics } from '../data/lldTopics';
import StudyTracker from './StudyTracker';

const PATTERN_SLUGS = {
  singleton: 'singleton',
  'factory method': 'factory-method',
  'abstract factory': 'abstract-factory',
  builder: 'builder',
  prototype: 'prototype',
  adapter: 'adapter',
  facade: 'facade',
  decorator: 'decorator',
  composite: 'composite',
  proxy: 'proxy',
  bridge: 'bridge',
  flyweight: 'flyweight',
  iterator: 'iterator',
  observer: 'observer',
  strategy: 'strategy',
  command: 'command',
  state: 'state',
  'template method': 'template-method',
  visitor: 'visitor',
  mediator: 'mediator',
  memento: 'memento',
  'chain of responsibility': 'chain-of-responsibility',
};

function PatternTags({ item }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {item.pattern.split(', ').map((pattern) => (
        <a
          key={pattern}
          href={`https://algomaster.io/learn/lld/${PATTERN_SLUGS[pattern.toLowerCase()]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="status-pill hover:border-accent hover:text-accent"
          title={`View ${pattern} pattern on AlgoMaster`}
        >
          {pattern}
        </a>
      ))}
    </span>
  );
}

export default function LldTracker() {
  const [items, setItems] = useCloudStorage('lld', lldTopics);
  return (
    <StudyTracker
      id="lld"
      title="Low level design"
      description="Turn good ideas into clear, maintainable object oriented designs."
      sourceLabel="AlgoMaster"
      sourceUrl="https://algomaster.io/learn/lld"
      contextLabel="Design patterns"
      contextField="pattern"
      renderContext={(item) => <PatternTags item={item} />}
      contextAsTags
      priorityFilter
      items={items}
      setItems={setItems}
    />
  );
}
