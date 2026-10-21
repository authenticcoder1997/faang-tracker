import StudyTracker from './StudyTracker';

export default function HldTracker({ items, setItems }) {
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
