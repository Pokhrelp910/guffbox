// The Cricket Guff Studio — Live YouTube Stream Audience Poll & Prediction Widget
// Provides an esports-grade live viewer prediction bar and direct Stream Director controller

import React, { useState } from 'react';
import { StreamPollData, broadcastSync } from '../utils/broadcastSync';
import { BarChart3 } from 'lucide-react';

interface AudiencePollWidgetProps {
  poll: StreamPollData;
  isDirectorMode?: boolean;
  onUpdatePoll?: (newPoll: StreamPollData) => void;
  onCloseDirector?: () => void;
}

export const AudiencePollWidget: React.FC<AudiencePollWidgetProps> = ({
  poll,
  isDirectorMode = false,
  onUpdatePoll,
  onCloseDirector,
}) => {
  const [customQuestion, setCustomQuestion] = useState(poll.question);
  const [customOptA, setCustomOptA] = useState(poll.optionA.label);
  const [customOptB, setCustomOptB] = useState(poll.optionB.label);

  const totalVotes = Math.max(0, poll.optionA.votes + poll.optionB.votes);
  const pctA = totalVotes > 0 ? Math.round((poll.optionA.votes / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;

  // Director Controls Modal
  if (isDirectorMode) {
    const handleSavePoll = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const updated: StreamPollData = {
        isOpen: true,
        question: customQuestion.trim() || 'Will Nepal win today?',
        optionA: { label: customOptA.trim() || 'Yes', votes: poll.optionA.votes },
        optionB: { label: customOptB.trim() || 'No', votes: poll.optionB.votes },
      };
      if (onUpdatePoll) onUpdatePoll(updated);
      broadcastSync.publish({ type: 'UPDATE_STREAM_POLL', poll: updated });
    };

    const handleAddVotes = (target: 'A' | 'B', count: number) => {
      const updated: StreamPollData = {
        ...poll,
        optionA: target === 'A' ? { ...poll.optionA, votes: poll.optionA.votes + count } : poll.optionA,
        optionB: target === 'B' ? { ...poll.optionB, votes: poll.optionB.votes + count } : poll.optionB,
      };
      if (onUpdatePoll) onUpdatePoll(updated);
      broadcastSync.publish({ type: 'UPDATE_STREAM_POLL', poll: updated });
    };

    const handleResetVotes = () => {
      const updated: StreamPollData = {
        ...poll,
        optionA: { ...poll.optionA, votes: 0 },
        optionB: { ...poll.optionB, votes: 0 },
      };
      if (onUpdatePoll) onUpdatePoll(updated);
      broadcastSync.publish({ type: 'UPDATE_STREAM_POLL', poll: updated });
    };

    const handleToggleOpen = () => {
      const updated: StreamPollData = {
        ...poll,
        isOpen: !poll.isOpen,
      };
      if (onUpdatePoll) onUpdatePoll(updated);
      broadcastSync.publish({ type: 'UPDATE_STREAM_POLL', poll: updated });
    };

    const presetQuestions = [
      { q: 'Will the batting team chase the target?', a: 'Yes, Easy Win', b: 'No, Bowlers Defend' },
      { q: 'Will next over have a 6 or a Wicket?', a: 'Huge SIX!', b: 'WICKET Falls!' },
      { q: 'Will this over produce 10+ runs?', a: 'Over 10 Runs', b: 'Under 10 Runs' },
      { q: 'Who is the Player of the Match?', a: 'Striker Batter', b: 'Leading Bowler' },
    ];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-white select-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(14,25,56,0.92) 0%, rgba(26,4,8,0.96) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="bg-gradient-to-br from-[#081026] via-[#050a18] to-[#1c050a] border-2 border-yellow-500/50 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 text-white">
          <div className="flex items-center justify-between border-b border-yellow-500/20 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              <h2 className="text-base font-black uppercase tracking-wider text-yellow-400">
                Live YouTube Audience Poll Director
              </h2>
            </div>
            {onCloseDirector && (
              <button
                onClick={onCloseDirector}
                className="w-8 h-8 rounded-xl bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 flex items-center justify-center transition border border-yellow-500/30 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Master Toggle Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#050a18]/80 border border-yellow-500/30">
            <div>
              <span className="text-xs font-bold text-white block">Stream Overlay Visibility</span>
              <span className="text-[11px] text-white/70">
                {poll.isOpen ? 'Currently visible on OBS and Watchalong' : 'Hidden from broadcast stream'}
              </span>
            </div>
            <button
              onClick={handleToggleOpen}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                poll.isOpen
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-[#050a18] shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                  : 'bg-[#0e1938] text-white hover:text-yellow-300 border border-yellow-500/30'
              }`}
            >
              {poll.isOpen ? '● LIVE ON STREAM' : '○ DISABLED'}
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-2">
              ⚡ Quick Poll Presets:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presetQuestions.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomQuestion(p.q);
                    setCustomOptA(p.a);
                    setCustomOptB(p.b);
                  }}
                  className="text-left p-2.5 rounded-xl bg-[#0e1938] hover:bg-[#152554] border border-yellow-500/20 text-[11px] text-white transition cursor-pointer"
                >
                  <span className="font-bold text-yellow-400 block truncate">{p.q}</span>
                  <span className="text-white/70 text-[10px]">{p.a} vs {p.b}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Question & Options */}
          <form onSubmit={handleSavePoll} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-white block mb-1">Poll Question</label>
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="e.g. Can Nepal chase 185?"
                className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-white/40 focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-yellow-400 block mb-1">Option A (Dark Blue)</label>
                <input
                  type="text"
                  value={customOptA}
                  onChange={(e) => setCustomOptA(e.target.value)}
                  placeholder="Yes (Win)"
                  className="w-full bg-[#0a142c] border border-blue-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-yellow-400 block mb-1">Option B (Dark Red)</label>
                <input
                  type="text"
                  value={customOptB}
                  onChange={(e) => setCustomOptB(e.target.value)}
                  placeholder="No (Bowlers Defend)"
                  className="w-full bg-[#1c0810] border border-red-900 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-300 text-[#050a18] font-black text-xs px-5 py-2 rounded-xl transition shadow cursor-pointer"
              >
                Apply Question to Stream
              </button>
            </div>
          </form>

          {/* Live Votes Counter & Simulator */}
          <div className="p-3 bg-[#050a18]/80 rounded-2xl border border-yellow-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Live Vote Telemetry ({totalVotes} total):</span>
              <button
                onClick={handleResetVotes}
                className="text-[10px] text-yellow-300 hover:text-white underline cursor-pointer"
              >
                Reset Votes
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[#0a142c] rounded-xl border border-blue-900/60 text-center">
                <span className="text-[11px] font-bold text-yellow-300 block truncate">{poll.optionA.label}</span>
                <span className="text-lg font-black text-white">{poll.optionA.votes} ({pctA}%)</span>
                <div className="flex justify-center space-x-1 mt-1">
                  <button
                    type="button"
                    onClick={() => handleAddVotes('A', 5)}
                    className="bg-[#14224c] hover:bg-[#1e3474] text-yellow-300 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/20"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddVotes('A', 25)}
                    className="bg-[#14224c] hover:bg-[#1e3474] text-yellow-300 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/20"
                  >
                    +25
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddVotes('A', 100)}
                    className="bg-[#14224c] hover:bg-[#1e3474] text-yellow-300 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/20"
                  >
                    +100
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-[#1c0810] rounded-xl border border-red-950 text-center">
                <span className="text-[11px] font-bold text-yellow-300 block truncate">{poll.optionB.label}</span>
                <span className="text-lg font-black text-white">{poll.optionB.votes} ({pctB}%)</span>
                <div className="flex justify-center space-x-1 mt-1">
                  <button
                    type="button"
                    onClick={() => handleAddVotes('B', 5)}
                    className="bg-[#24060e] hover:bg-[#3d0a17] text-yellow-300 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/20"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddVotes('B', 25)}
                    className="bg-[#24060e] hover:bg-[#3d0a17] text-yellow-300 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/20"
                  >
                    +25
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddVotes('B', 100)}
                    className="bg-[#24060e] hover:bg-[#3d0a17] text-yellow-300 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/20"
                  >
                    +100
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display Mode on Broadcast Screen
  if (!poll.isOpen) return null;

  return (
    <div
      className="rounded-xl border p-2.5 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all animate-fadeIn"
      style={{
        background: 'linear-gradient(90deg, #070d1e 0%, #0e1938 50%, #1c050a 100%)',
        borderColor: 'rgba(250,204,21,0.4)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 15px rgba(250,204,21,0.15)',
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping inline-block" />
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
            📊 LIVE YOUTUBE POLL
          </span>
        </div>
        <span className="text-[10px] font-mono text-yellow-300 font-bold">
          {totalVotes.toLocaleString()} votes
        </span>
      </div>

      {/* Question */}
      <div className="text-xs font-bold text-white mb-2 leading-tight">
        {poll.question}
      </div>

      {/* Duel Percentage Bar */}
      <div className="h-5 w-full bg-[#050a18] rounded-lg overflow-hidden flex border border-yellow-500/30 p-0.5 relative">
        <div
          className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] rounded-l transition-all duration-500 flex items-center px-2 text-[10px] font-black text-white overflow-hidden shadow"
          style={{ width: `${pctA}%` }}
        >
          <span className="truncate">{poll.optionA.label} {pctA}%</span>
        </div>
        <div
          className="h-full bg-gradient-to-r from-[#991b1b] to-[#7f1d1d] rounded-r transition-all duration-500 flex items-center justify-end px-2 text-[10px] font-black text-yellow-300 overflow-hidden shadow"
          style={{ width: `${pctB}%` }}
        >
          <span className="truncate">{poll.optionB.label} {pctB}%</span>
        </div>
      </div>
    </div>
  );
};
