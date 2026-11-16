// GuffBox Cricket Studio — Granular 30+ Video Registry & Media Manager

import React, { useState } from 'react';
import { MediaSlotInfo, mediaRegistry } from '../utils/mediaRegistry';
import { MediaEventKey } from '../core/types';

interface MediaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreviewEvent: (key: MediaEventKey) => void;
}

export const MediaManagerModal: React.FC<MediaManagerModalProps> = ({
  isOpen,
  onClose,
  onPreviewEvent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [slots, setSlots] = useState<MediaSlotInfo[]>(mediaRegistry.getSlots());
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Events (30+)' },
    { id: 'runs', label: 'Runs & Boundaries' },
    { id: 'dismissals', label: 'Dismissals' },
    { id: 'extras', label: 'Extras & Penalties' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'match_states', label: 'Match States' },
  ];

  const filteredSlots = selectedCategory === 'all'
    ? slots
    : slots.filter((s) => s.category === selectedCategory);

  const handleFileUpload = (key: MediaEventKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      mediaRegistry.registerVideo(key, result);
      setSlots(mediaRegistry.getSlots());
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (key: MediaEventKey) => {
    mediaRegistry.removeVideo(key);
    setSlots(mediaRegistry.getSlots());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 font-sans text-white">
      <div className="bg-slate-900 border-2 border-purple-500 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🎬</span>
            <div>
              <h2 className="text-2xl font-black font-['Teko'] tracking-wider text-purple-400">
                MEDIA REGISTRY & 30+ VIDEO STINGS MANAGER
              </h2>
              <p className="text-xs text-slate-400">
                Upload custom Google Flow / MP4 / WebM animations with audio, or let Star Sports CSS fallback play.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition"
          >
            ✕ Close
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center px-6 py-3 bg-slate-950/60 border-b border-slate-800 overflow-x-auto space-x-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Video Slots Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlots.map((slot) => {
            const hasCustom = !!slot.customVideoUrl;
            return (
              <div
                key={slot.key}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition ${
                  hasCustom
                    ? 'bg-purple-950/20 border-purple-500/60'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                      {slot.key}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        hasCustom
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {hasCustom ? 'Custom Video' : 'CSS Fallback'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2">{slot.label}</h3>

                  {slot.fallbackKey && !hasCustom && (
                    <p className="text-[11px] text-slate-500 italic mb-2">
                      Fallback: <span className="text-slate-400">{slot.fallbackKey}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-3 border-t border-slate-800/80">
                  {/* Upload video file */}
                  <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-center py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-700 transition">
                    <span>{hasCustom ? 'Replace Video' : 'Upload MP4/WebM'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => handleFileUpload(slot.key, e)}
                    />
                  </label>

                  {/* Test play button */}
                  <button
                    onClick={() => {
                      if (hasCustom && slot.customVideoUrl) {
                        setActivePreviewUrl(slot.customVideoUrl);
                      } else {
                        onPreviewEvent(slot.key);
                      }
                    }}
                    title="Test Play Sting"
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black transition"
                  >
                    ▶ Test
                  </button>

                  {/* Delete custom video */}
                  {hasCustom && (
                    <button
                      onClick={() => handleRemove(slot.key)}
                      title="Remove Custom Video"
                      className="bg-red-900/50 hover:bg-red-800 text-red-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Video Preview Modal */}
        {activePreviewUrl && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4">
            <div className="relative max-w-2xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-purple-500 p-4 shadow-2xl">
              <button
                onClick={() => setActivePreviewUrl(null)}
                className="absolute top-2 right-2 bg-slate-800 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold z-10"
              >
                ✕
              </button>
              <video
                src={activePreviewUrl}
                autoPlay
                controls
                className="w-full rounded-xl max-h-[60vh] object-contain"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
