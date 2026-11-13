import { useEffect, useMemo, useState } from 'react';
import { useHomeworkSchedule } from '../hooks/useHomeworkSchedule';
import { dateKey } from '../lib/tasks';
import StudyTracker from './StudyTracker';

const shortDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });

export default function HldTracker({ isActive = true }) {
  const [today, setToday] = useState(dateKey);
  useEffect(() => {
    if (!isActive) return;
    const refresh = () => setToday(dateKey());
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [isActive]);

  const { schedule, hld, setHld } = useHomeworkSchedule(today, isActive);
  const items = useMemo(() => {
    if (!schedule) return hld;
    const dates = new Map(schedule.flatMap(({ date, designs }) =>
      designs.filter(({ track }) => track === 'hld').map(({ item }) => [item.id, date]),
    ));
    return hld.map((item) => {
      const date = item.completed ? item.homeworkDate : dates.get(item.id);
      const label = date && date !== item.completedOn
        ? shortDate.format(new Date(`${date}T12:00:00`)) : undefined;
      return { ...item, date: item.completed && label ? `Homework ${label}` : label };
    });
  }, [hld, schedule]);

  return (
    <StudyTracker
      id="hld"
      title="System design"
      description="See the bigger picture. Work through the systems behind everyday products."
      sourceLabel="HelloInterview"
      sourceUrl="https://hellointerview.com/learn/system-design"
      items={items}
      setItems={setHld}
    />
  );
}
