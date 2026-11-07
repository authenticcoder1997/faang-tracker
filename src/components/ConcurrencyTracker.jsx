import { useCloudStorage } from '../hooks/useCloudStorage';
import { concurrencyTopics } from '../data/concurrencyTopics';
import StudyTracker from './StudyTracker';

export default function ConcurrencyTracker() {
  const [items, setItems] = useCloudStorage('concurrency', concurrencyTopics);
  return (
    <StudyTracker
      id="concurrency"
      title="Concurrency"
      description="Bring clarity to shared state, coordination, and parallel work."
      sourceLabel="AlgoMaster"
      sourceUrl="https://algomaster.io/practice/concurrency"
      contextLabel="Topic"
      contextField="topic"
      accessFilter
      items={items}
      setItems={setItems}
    />
  );
}
