import { useMemo } from 'react';
import { lldTopics } from '../data/lldTopics';
import { hldTopics } from '../data/hldTopics';
import { striverDsaTopics } from '../lib/dsaPlan';
import { buildHomeworkSchedule } from '../lib/homeworkSchedule';
import { useCloudStorage } from './useCloudStorage';
import { useWorkspaceValue } from './useWorkspace';

export function useHomeworkSchedule(today, enabled = true) {
  const plan = useWorkspaceValue((state) => state.data.homework);
  const skips = useWorkspaceValue((state) => state.data.homeworkSkips);
  const [dsa, setDsa] = useCloudStorage('dsa', striverDsaTopics);
  const [lld, setLld] = useCloudStorage('lld', lldTopics);
  const [hld, setHld] = useCloudStorage('hld', hldTopics);
  const schedule = useMemo(
    () => enabled ? buildHomeworkSchedule(dsa, lld, hld, today, plan, skips) : null,
    [dsa, lld, hld, today, plan, skips, enabled],
  );
  return { schedule, plan, skips, dsa, setDsa, setLld, hld, setHld };
}
