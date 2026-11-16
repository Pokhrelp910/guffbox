// GuffBox Cricket Studio — Hotkey Shortcuts Listener

import { useEffect } from 'react';

interface HotkeyHandlerProps {
  onScoreRuns: (runs: number) => void;
  onWicket: () => void;
  onWide: () => void;
  onNoBall: () => void;
  onBye: () => void;
  onLegBye: () => void;
  onPenalty: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSwapStrike: () => void;
  disabled?: boolean;
}

export const useCricketHotkeys = ({
  onScoreRuns,
  onWicket,
  onWide,
  onNoBall,
  onBye,
  onLegBye,
  onPenalty,
  onUndo,
  onRedo,
  onSwapStrike,
  disabled = false,
}: HotkeyHandlerProps) => {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input or select
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Strike Swap: S
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onSwapStrike();
        return;
      }

      // Number runs: 0, 1, 2, 3, 4, 6
      if (['0', '1', '2', '3', '4', '6'].includes(e.key)) {
        e.preventDefault();
        onScoreRuns(parseInt(e.key, 10));
        return;
      }

      // Quick Extras
      if (e.key.toLowerCase() === 'w' && !e.ctrlKey) {
        e.preventDefault();
        onWicket();
        return;
      }
      if (e.key.toLowerCase() === 'd' && !e.ctrlKey) { // 'd' for wiDe
        e.preventDefault();
        onWide();
        return;
      }
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey) { // 'n' for No-ball
        e.preventDefault();
        onNoBall();
        return;
      }
      if (e.key.toLowerCase() === 'b' && !e.ctrlKey) { // 'b' for Bye
        e.preventDefault();
        onBye();
        return;
      }
      if (e.key.toLowerCase() === 'l' && !e.ctrlKey) { // 'l' for Leg-bye
        e.preventDefault();
        onLegBye();
        return;
      }
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey) { // 'p' for Penalty
        e.preventDefault();
        onPenalty();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    disabled,
    onScoreRuns,
    onWicket,
    onWide,
    onNoBall,
    onBye,
    onLegBye,
    onPenalty,
    onUndo,
    onRedo,
    onSwapStrike,
  ]);
};
