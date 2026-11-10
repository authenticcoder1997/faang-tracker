import { useEffect, useRef, useState } from 'react';

function targetAt(list, x, y) {
  const row = document.elementFromPoint(x, y)?.closest('[data-task-row]');
  return row?.parentElement === list ? row.dataset.taskRow : null;
}

export function useTaskReorder(onReorder) {
  const gesture = useRef(null);
  const [drag, setDrag] = useState(null);

  useEffect(() => () => cancelAnimationFrame(gesture.current?.frame), []);

  function updateTarget(current) {
    const targetId = targetAt(current.list, current.x, current.y);
    setDrag((previous) => previous?.targetId === targetId && previous.movedId === current.movedId
      ? previous : { movedId: current.movedId, targetId });
  }

  function scrollWhileDragging(current) {
    if (!current.list.isConnected) return;
    const edge = 64;
    const top = current.list.closest('.app-shell')?.querySelector('header')?.getBoundingClientRect().bottom || 0;
    const bottom = window.innerHeight;
    const delta = current.y < top + edge ? current.y - top - edge
      : current.y > bottom - edge ? current.y - bottom + edge : 0;
    if (!delta) return;
    window.scrollBy({ top: Math.max(-18, Math.min(18, delta / 4)), behavior: 'instant' });
    updateTarget(current);
    current.frame = requestAnimationFrame(() => scrollWhileDragging(current));
  }

  function finish(event, drop) {
    const current = gesture.current;
    if (current?.pointerId !== event.pointerId) return;
    cancelAnimationFrame(current.frame);
    gesture.current = null;
    setDrag(null);
    if (!drop || !current.started) return;
    const targetId = targetAt(current.list, event.clientX, event.clientY);
    if (targetId && targetId !== current.movedId) onReorder(current.ids, current.movedId, targetId);
  }

  function handleProps(movedId, ids, index) {
    return {
      onPointerDown(event) {
        if (event.button !== 0 || !event.isPrimary || gesture.current) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        gesture.current = {
          pointerId: event.pointerId,
          list: event.currentTarget.closest('ul'),
          movedId,
          ids,
          x: event.clientX,
          y: event.clientY,
          started: false,
        };
      },
      onPointerMove(event) {
        const current = gesture.current;
        if (current?.pointerId !== event.pointerId) return;
        if (!current.started && Math.hypot(current.x - event.clientX, current.y - event.clientY) < 5) return;
        current.started = true;
        current.x = event.clientX;
        current.y = event.clientY;
        cancelAnimationFrame(current.frame);
        updateTarget(current);
        scrollWhileDragging(current);
      },
      onPointerUp: (event) => finish(event, true),
      onPointerCancel: (event) => finish(event, false),
      onLostPointerCapture: (event) => finish(event, false),
      onKeyDown(event) {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        const targetId = ids[index + (event.key === 'ArrowUp' ? -1 : 1)];
        if (targetId) onReorder(ids, movedId, targetId);
      },
    };
  }

  return { drag, handleProps };
}
