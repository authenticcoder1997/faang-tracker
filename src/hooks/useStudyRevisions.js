import { useCallback, useMemo } from 'react';
import { markRevisionReviewed, queueRevision, revisionTrack } from '../lib/studyRevisions';
import { dateKey } from '../lib/tasks';
import { useWorkspace, useWorkspaceValue } from './useWorkspace';

export function useStudyRevisions(track) {
  const { updateData } = useWorkspace();
  const saved = useWorkspaceValue((state) => state.data.revisions);
  const revisions = useMemo(() => track ? saved.filter((record) => revisionTrack(record) === track) : saved, [saved, track]);
  const queuedIds = useMemo(() => new Set(revisions.map(({ id }) => id)), [revisions]);

  const addRevision = useCallback((id, source) => updateData((current) => {
    const revisions = queueRevision(current.revisions, id, source, dateKey());
    return revisions === current.revisions ? current : { ...current, revisions };
  }), [updateData]);
  const toggleRevision = useCallback((id, source) => updateData((current) => ({
    ...current,
    revisions: current.revisions.some((record) => record.id === id)
      ? current.revisions.filter((record) => record.id !== id)
      : queueRevision(current.revisions, id, source, dateKey()),
  })), [updateData]);
  const markReviewed = useCallback((id) => updateData((current) => ({
    ...current, revisions: markRevisionReviewed(current.revisions, id, dateKey()),
  })), [updateData]);
  const removeRevision = useCallback((id) => updateData((current) => ({
    ...current, revisions: current.revisions.filter((record) => record.id !== id),
  })), [updateData]);

  return { revisions, queuedIds, addRevision, toggleRevision, markReviewed, removeRevision };
}
