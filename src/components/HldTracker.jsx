import { useCloudStorage } from '../hooks/useCloudStorage';
import { hldTopics } from '../data/hldTopics';
import StudyTracker from './StudyTracker';

export default function HldTracker() {
  const [items, setItems] = useCloudStorage('hld', hldTopics);
  return (
    <StudyTracker
      id="hld"
      title="System design"
      description="See the bigger picture. Work through the systems behind everyday products."
      sourceLabel="HelloInterview"
      sourceUrl="https://hellointerview.com/learn/system-design"
      items={items}
      setItems={setItems}
    />
  );
}
