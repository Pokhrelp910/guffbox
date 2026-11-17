// GuffBox Cricket Studio — Granular 30+ Video Registry & Media Manager (IndexedDB Powered)

import React, { useState, useEffect } from 'react';
import { MediaSlotInfo, mediaRegistry } from '../utils/mediaRegistry';
import { MediaEventKey } from '../core/types';
import { HardDrive, Upload, Play, Trash2, CheckCircle2, Film } from 'lucide-react';

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
  const [slots, setSlots] = useState<MediaSlotInfo[]>(() => mediaRegistry.getSlots());
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    setSlots(mediaRegistry.getSlots());

    // Subscribe to any changes from IndexedDB
    const unsubscribe = mediaRegistry.subscribe(() => {
      setSlots(mediaRegistry.getSlots());
    });

    return () => {
      unsubscribe();
    };
  }, []);

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

  const customVideosCount = slots.filter((s) => !!s.customVideoUrl).length;

  const handleFileUpload = async (key: MediaEventKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKey(key);
    try {
      await mediaRegistry.registerVideoFile(key, file, file.name);
      setSlots(mediaRegistry.getSlots());
    } catch (err) {
      console.error('Failed to save video to IndexedDB:', err);
      alert('Failed to store video: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingKey(null);
      e.target.value = '';
    }
  };

  const handleRemove = async (key: MediaEventKey) => {
    if (confirm(`Remove custom video sting for "${key}"?`)) {
      await mediaRegistry.removeVideo(key);
      setSlots(mediaRegistry.getSlots());
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to remove ALL uploaded video stings? This action cannot be undone.')) {
      await mediaRegistry.clearAllVideos();
      setSlots(mediaRegistry.getSlots());
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans text-white select-none"
      style={{
        background: 'radial-gradient(circle at center, rgba(14,25,56,0.92) 0%, rgba(26,4,8,0.96) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="bg-gradient-to-br from-[#081026] via-[#050a18] to-[#1c050a] border-2 border-yellow-500/50 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-[#0b1739] via-[#070e24] to-[#260810] gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🎬</span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-black font-['Teko'] tracking-wider text-yellow-400">
                  MEDIA REGISTRY & 30+ VIDEO STINGS MANAGER
                </h2>
                <span className="flex items-center space-x-1 bg-[#0e1938] border border-yellow-500/40 text-yellow-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <HardDrive className="w-3 h-3 text-yellow-400" />
                  <span>IndexedDB Permanent Storage</span>
                </span>
              </div>
              <p className="text-xs text-white/80">
                Uploaded MP4/WebM videos are stored permanently in browser IndexedDB (never lost on page reload).
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {customVideosCount > 0 && (
              <button
                onClick={handleClearAll}
                className="bg-[#24060e] hover:bg-[#3d0a17] border border-red-800 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                title="Remove all uploaded videos"
              >
                Clear All ({customVideosCount})
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 px-4 py-2 rounded-xl text-sm font-bold transition border border-yellow-500/30 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#050a18]/80 border-b border-yellow-500/20 overflow-x-auto space-x-2">
          <div className="flex items-center space-x-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-yellow-400 text-[#050a18] font-black shadow-md'
                    : 'bg-[#0e1938] text-white hover:text-yellow-300 border border-yellow-500/20 hover:bg-[#152554]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-white/80 whitespace-nowrap pl-2">
            Active Custom Videos: <strong className="text-yellow-400">{customVideosCount}</strong> / {slots.length}
          </div>
        </div>

        {/* Video Slots Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlots.map((slot) => {
            const hasCustom = !!slot.customVideoUrl;
            const isUploading = uploadingKey === slot.key;

            return (
              <div
                key={slot.key}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition ${
                  hasCustom
                    ? 'bg-[#1c0810]/80 border-red-900/70 shadow-lg'
                    : 'bg-[#0a1226]/80 border-blue-900/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-yellow-300 uppercase">
                      {slot.key}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center space-x-1 ${
                        hasCustom
                          ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                          : 'bg-[#0e1938] text-white/70 border border-yellow-500/20'
                      }`}
                    >
                      {hasCustom ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-yellow-400" />
                          <span>Permanent Video</span>
                        </>
                      ) : (
                        <span>CSS Fallback</span>
                      )}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{slot.label}</h3>

                  {hasCustom && (
                    <div className="text-[11px] text-yellow-300 mb-2 truncate flex items-center space-x-1.5">
                      <Film className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      <span className="truncate text-white">{slot.fileName || 'custom-video.mp4'}</span>
                      {slot.fileSize && (
                        <span className="text-[10px] bg-[#070e24] text-yellow-300 px-1.5 py-0.2 rounded font-mono border border-yellow-500/30">
                          {formatFileSize(slot.fileSize)}
                        </span>
                      )}
                    </div>
                  )}

                  {slot.fallbackKey && !hasCustom && (
                    <p className="text-[11px] text-white/60 italic mb-2">
                      Fallback: <span className="text-yellow-300">{slot.fallbackKey}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-3 border-t border-yellow-500/20">
                  {/* Upload video file */}
                  <label className={`flex-1 cursor-pointer text-center py-1.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                    isUploading
                      ? 'bg-yellow-400 text-[#050a18] border-white animate-pulse'
                      : 'bg-[#14224c] hover:bg-[#1f3575] text-white border-yellow-500/30'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Saving...' : hasCustom ? 'Replace Video' : 'Upload MP4/WebM'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      className="hidden"
                      disabled={isUploading}
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
                    className="bg-yellow-400 hover:bg-yellow-300 text-[#050a18] px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1 shadow cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test</span>
                  </button>

                  {/* Delete custom video */}
                  {hasCustom && (
                    <button
                      onClick={() => handleRemove(slot.key)}
                      title="Remove Custom Video"
                      className="bg-[#24060e] hover:bg-[#3d0a17] text-yellow-300 border border-red-800/60 p-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            <div className="relative max-w-2xl w-full bg-gradient-to-br from-[#081026] via-[#050a18] to-[#1c050a] rounded-2xl overflow-hidden border border-yellow-500/50 p-4 shadow-2xl">
              <button
                onClick={() => setActivePreviewUrl(null)}
                className="absolute top-2 right-2 bg-[#14224c] hover:bg-[#1f3575] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold z-10 border border-yellow-500/30 cursor-pointer"
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
