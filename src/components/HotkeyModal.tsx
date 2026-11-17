// The Cricket Guff Studio — Keyboard Shortcuts Cheatsheet Modal

import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface HotkeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeyModal: React.FC<HotkeyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotkeysList = [
    { key: '0, 1, 2, 3, 4, 6', desc: 'Score runs directly off bat (0 = Dot, 4 = Boundary, 6 = Maximum)' },
    { key: 'S', desc: 'Swap batsman strike (Striker ⇄ Non-Striker)' },
    { key: 'W', desc: 'Wicket dismissal modal (Bowled, Caught, LBW, Stumped, etc.)' },
    { key: 'D', desc: 'Wide delivery (+1 extra, re-bowl)' },
    { key: 'N', desc: 'No-Ball delivery (+1 extra, triggers Free Hit)' },
    { key: 'B', desc: 'Byes extras' },
    { key: 'L', desc: 'Leg-Byes extras' },
    { key: 'E', desc: 'Advanced Extras & Compound Delivery Dialog (Runs off bat, byes, wickets)' },
    { key: 'P', desc: 'Penalty runs (+5 runs awarded)' },
    { key: 'Ctrl + Z', desc: 'Instant Undo last ball (restores previous state)' },
    { key: 'Ctrl + Y', desc: 'Redo previously undone ball' },
    { key: 'Alt + 1 / Shift + 1', desc: 'Stadium Airhorn / Trumpet blast 📣' },
    { key: 'Alt + 2 / Shift + 2', desc: 'Roaring Crowd Cheer 🙌' },
    { key: 'Alt + 3 / Shift + 3', desc: 'Howzat! Appeal Shout ⚡' },
    { key: 'Alt + 4 / Shift + 4', desc: 'Rhythmic Stadium Clapping 👏' },
    { key: 'Alt + 5 / Shift + 5', desc: 'Referee Whistle 🎵' },
    { key: 'Alt + 6 / Shift + 6', desc: 'Celebration Fanfare 🎺' },
    { key: 'H or ?', desc: 'Toggle this Hotkey Cheatsheet' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none font-sans"
      style={{
        background: 'radial-gradient(circle at center, rgba(14,25,56,0.92) 0%, rgba(26,4,8,0.96) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="w-full max-w-lg bg-gradient-to-br from-[#081026] via-[#050a18] to-[#1c050a] border border-yellow-500/50 rounded-3xl p-6 shadow-2xl relative"
        style={{
          boxShadow: '0 0 50px rgba(0,0,0,0.95), 0 0 25px rgba(250,204,21,0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-yellow-500/20 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Teko'] text-2xl font-bold text-yellow-400 uppercase tracking-wider">
                SCORER KEYBOARD SHORTCUTS
              </h3>
              <p className="text-xs text-white/80 -mt-1 font-medium">
                Blind-typing scoring controls for live commentary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 flex items-center justify-center transition border border-yellow-500/30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {hotkeysList.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#0e1938]/90 border border-yellow-500/20 text-xs"
            >
              <kbd className="px-2.5 py-1 rounded-lg bg-[#070e24] border border-yellow-500/40 font-mono font-black text-yellow-300 shadow text-xs">
                {h.key}
              </kbd>
              <span className="text-white font-medium text-right max-w-[280px]">
                {h.desc}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-yellow-500/20 text-center text-[11px] text-yellow-300 font-semibold">
          Tip: You can use number keys anytime without clicking any buttons!
        </div>
      </div>
    </div>
  );
};
