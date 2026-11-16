// GuffBox Cricket Studio — Animation Overlay (Custom Video Sting or Motion Graphics Fallback)

import React, { useEffect, useRef } from 'react';
import { MediaEventKey } from '../core/types';
import { mediaRegistry } from '../utils/mediaRegistry';
import { stadiumAudio } from '../utils/soundEffects';

interface AnimationOverlayProps {
  eventKey: MediaEventKey | null;
  customText?: string;
  onComplete: () => void;
}

export const AnimationOverlay: React.FC<AnimationOverlayProps> = ({
  eventKey,
  customText,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!eventKey) return;

    // Check if custom video exists in registry
    const customVideoUrl = mediaRegistry.resolveVideoUrl(eventKey);

    if (customVideoUrl && videoRef.current) {
      videoRef.current.src = customVideoUrl;
      videoRef.current.play().catch((err) => {
        console.warn('Video playback warning, falling back to graphics:', err);
      });
      return;
    }

    // Otherwise, play Web Audio stadium sound effects for motion graphics fallback
    if (eventKey === 'four') {
      stadiumAudio.playFour();
    } else if (eventKey === 'six') {
      stadiumAudio.playSix();
    } else if (
      eventKey === 'bowled' ||
      eventKey === 'caught' ||
      eventKey === 'caught_behind' ||
      eventKey === 'lbw' ||
      eventKey === 'stumped' ||
      eventKey === 'run_out' ||
      eventKey === 'generic_wicket' ||
      eventKey === 'hit_wicket'
    ) {
      stadiumAudio.playWicket();
    } else if (eventKey === 'wide' || eventKey === 'noball') {
      stadiumAudio.playBuzzer();
    } else if (
      eventKey === 'half_century' ||
      eventKey === 'century' ||
      eventKey === 'haul_5w' ||
      eventKey === 'match_won'
    ) {
      stadiumAudio.playFanfare();
    } else if (eventKey === 'run_1' || eventKey === 'run_2' || eventKey === 'run_3') {
      stadiumAudio.playBatHit('medium');
    }

    // Auto-dismiss motion graphic after duration
    const timer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => clearTimeout(timer);
  }, [eventKey, onComplete]);

  if (!eventKey) return null;

  const customVideoUrl = mediaRegistry.resolveVideoUrl(eventKey);

  if (customVideoUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          onEnded={onComplete}
          className="max-w-4xl max-h-[80vh] object-contain drop-shadow-2xl"
        />
      </div>
    );
  }

  // Built-in Star Sports motion graphics fallback
  const renderGraphicContent = () => {
    if (eventKey === 'four') {
      return (
        <div className="flex flex-col items-center animate-bounce">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white font-black text-8xl font-['Teko'] px-16 py-4 rounded-3xl border-4 border-yellow-400 shadow-[0_0_80px_rgba(59,130,246,0.8)] tracking-widest uppercase">
            FOUR !
          </div>
          <span className="mt-2 text-2xl font-black text-yellow-400 tracking-widest drop-shadow-md">
            CRACKING BOUNDARY 4️⃣
          </span>
        </div>
      );
    }

    if (eventKey === 'six') {
      return (
        <div className="flex flex-col items-center animate-pulse">
          <div className="bg-gradient-to-r from-purple-800 via-fuchsia-600 to-indigo-900 text-yellow-300 font-black text-9xl font-['Teko'] px-20 py-4 rounded-3xl border-4 border-yellow-300 shadow-[0_0_100px_rgba(168,85,247,0.9)] tracking-widest uppercase">
            MAXIMUM 6 !
          </div>
          <span className="mt-2 text-2xl font-black text-white tracking-widest drop-shadow-md">
            OUT OF THE GROUND 🚀
          </span>
        </div>
      );
    }

    if (
      eventKey === 'bowled' ||
      eventKey === 'caught' ||
      eventKey === 'caught_behind' ||
      eventKey === 'caught_and_bowled' ||
      eventKey === 'lbw' ||
      eventKey === 'stumped' ||
      eventKey === 'run_out' ||
      eventKey === 'hit_wicket' ||
      eventKey === 'duck_out' ||
      eventKey === 'golden_duck' ||
      eventKey === 'generic_wicket'
    ) {
      return (
        <div className="flex flex-col items-center animate-pulse">
          <div className="bg-gradient-to-r from-red-800 via-red-600 to-red-900 text-white font-black text-8xl font-['Teko'] px-16 py-4 rounded-3xl border-4 border-white shadow-[0_0_90px_rgba(239,68,68,0.9)] tracking-widest uppercase">
            OUT !
          </div>
          <span className="mt-2 text-2xl font-black text-red-400 tracking-wider bg-black/80 px-6 py-1 rounded-full border border-red-500 uppercase">
            {customText || eventKey.replace('_', ' ')}
          </span>
        </div>
      );
    }

    if (eventKey === 'wide') {
      return (
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-7xl font-['Teko'] px-12 py-3 rounded-2xl border-2 border-yellow-300 shadow-[0_0_60px_rgba(245,158,11,0.8)] tracking-wider uppercase">
            WIDE BALL
          </div>
          {customText && <span className="text-xl font-bold text-yellow-300 mt-1">{customText}</span>}
        </div>
      );
    }

    if (eventKey === 'noball') {
      return (
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-7xl font-['Teko'] px-12 py-3 rounded-2xl border-2 border-yellow-300 shadow-[0_0_70px_rgba(239,68,68,0.8)] tracking-wider uppercase">
            NO BALL + FREE HIT !
          </div>
          {customText && <span className="text-xl font-bold text-yellow-300 mt-1">{customText}</span>}
        </div>
      );
    }

    if (eventKey === 'half_century' || eventKey === 'century') {
      return (
        <div className="flex flex-col items-center animate-bounce">
          <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-slate-950 font-black text-8xl font-['Teko'] px-16 py-4 rounded-3xl border-4 border-white shadow-[0_0_90px_rgba(234,179,8,0.9)] tracking-widest uppercase">
            {eventKey === 'half_century' ? '50 RUNS !' : '100 - CENTURY !'}
          </div>
          <span className="mt-2 text-2xl font-black text-yellow-300 uppercase">
            {customText || 'Brilliant Batting Milestone'}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <div className="bg-slate-900/90 text-yellow-400 font-black text-6xl font-['Teko'] px-12 py-3 rounded-2xl border-2 border-slate-700 shadow-2xl tracking-wider uppercase">
          {customText || eventKey.replace('_', ' ')}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none transition-all">
      {renderGraphicContent()}
    </div>
  );
};
