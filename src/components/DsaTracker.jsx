import { useCloudStorage } from '../hooks/useCloudStorage';
import StudyTracker from './StudyTracker';
import { DSA_SECTIONS_LIST, dsaTopics } from '../data/dsaTopics';

export default function DsaTracker() {
  const [items, setItems] = useCloudStorage('dsa', dsaTopics);
  return (
    <StudyTracker
      id="dsa"
      title="Data structures & algorithms"
      description="Build the foundations, one thoughtful solution at a time."
      sourceLabel="TakeUForward"
      sourceUrl="https://takeuforward.org/plus"
      items={items}
      setItems={setItems}
      sectionDefinitions={DSA_SECTIONS_LIST}
      initiallyCollapsed
    />
  );
}
