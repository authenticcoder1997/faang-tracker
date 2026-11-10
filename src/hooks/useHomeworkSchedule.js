import { useMemo } from 'react';
import { lldTopics } from '../data/lldTopics';
import { hldTopics } from '../data/hldTopics';
import { striverDsaTopics } from '../lib/dsaPlan';
import { buildHomeworkSchedule } from '../lib/homeworkSchedule';
import { useCloudStorage } from './useCloudStorage';
import { useWorkspaceValue } from './useWorkspace';

export function useHomeworkSchedule(today, enabled = true) {
  const plan = useWorkspaceValue((state) => state.data.homework);
  const [dsa, setDsa] = useCloudStorage('dsa', striverDsaTopics);
  const [lld, setLld] = useCloudStorage('lld', lldTopics);
  const [hld, setHld] = useCloudStorage('hld', hldTopics);
  const schedule = useMemo(
    () => enabled ? buildHomeworkSchedule(dsa, lld, hld, today, plan) : null,
    [dsa, lld, hld, today, plan, enabled],
  );
  return { schedule, plan, dsa, setDsa, setLld, hld, setHld };
}
