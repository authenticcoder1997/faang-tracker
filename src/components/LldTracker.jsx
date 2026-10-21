import React from 'react';
import StudyTracker from './StudyTracker';

const PATTERN_SLUGS = {
  singleton: 'singleton',
  factory: 'factory-method',
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
  const parts = (item.pattern || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.map((part, index) => {
    const key = part
      .toLowerCase()
      .replace(/\s*\([^)]*\)\s*/g, '')
      .trim();
    const slug = PATTERN_SLUGS[key];
    return (
      <React.Fragment key={part}>
        {index > 0 && ', '}
        {slug ? (
          <a
            href={`https://algomaster.io/learn/lld/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-accent hover:underline underline-offset-4"
            title={`View ${part} pattern on AlgoMaster`}
          >
            {part}
          </a>
        ) : (
          part
        )}
      </React.Fragment>
    );
  });
}

export default function LldTracker({ items, setItems }) {
  return (
    <StudyTracker
      id="lld"
      title="Low level design"
      description="Turn good ideas into clear, maintainable object oriented designs."
      sourceLabel="AlgoMaster"
      sourceUrl="https://algomaster.io/learn/lld"
      contextLabel="Pattern"
      contextField="pattern"
      renderContext={(item) => <PatternTags item={item} />}
      priorityFilter
      items={items}
      setItems={setItems}
    />
  );
}
