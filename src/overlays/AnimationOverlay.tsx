// GuffBox Cricket Studio — Premium Star Sports Motion Graphics Overlay v2.0

import React, { useState, useEffect, useRef } from 'react';
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
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [, setMediaVersion] = useState(0);

  useEffect(() => {
    return mediaRegistry.subscribe(() => {
      setMediaVersion((v) => v + 1);
    });
  }, []);

  const customVideoUrl = eventKey ? mediaRegistry.resolveVideoUrl(eventKey) : null;

  useEffect(() => {
    if (!eventKey) return;

    if (customVideoUrl && videoRef.current) {
      videoRef.current.src = customVideoUrl;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Unmuted video play rejected, retrying muted:', err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => { onCompleteRef.current(); });
          }
        });
      }
      const safetyTimer = setTimeout(() => { onCompleteRef.current(); }, 5000);
      return () => clearTimeout(safetyTimer);
    }

    // Stadium audio
    if (eventKey === 'four') {
      stadiumAudio.playFour();
    } else if (eventKey === 'six') {
      stadiumAudio.playSix();
    } else if (['bowled','caught','caught_behind','lbw','stumped','run_out','generic_wicket','hit_wicket'].includes(eventKey)) {
      stadiumAudio.playWicket();
    } else if (eventKey === 'wide' || eventKey === 'noball') {
      stadiumAudio.playBuzzer();
    } else if (['half_century','century','haul_5w','match_won'].includes(eventKey)) {
      stadiumAudio.playFanfare();
    } else if (['run_1','run_2','run_3'].includes(eventKey)) {
      stadiumAudio.playBatHit('medium');
    }

    // Auto-dismiss within 1.8 seconds guaranteed
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 1800);

    return () => clearTimeout(timer);
  }, [eventKey, customVideoUrl]);

  if (!eventKey) return null;

  if (customVideoUrl) {
    return (
      <div
        onClick={() => onCompleteRef.current()}
        className="fixed inset-0 z-50 flex items-center justify-center select-none cursor-pointer"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      >
        <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center pointer-events-auto">
          <video
            ref={videoRef}
            src={customVideoUrl}
            autoPlay
            playsInline
            onEnded={() => onCompleteRef.current()}
            onError={() => onCompleteRef.current()}
            className="max-w-4xl max-h-[80vh] object-contain rounded-2xl"
            style={{ filter: 'drop-shadow(0 0 60px rgba(0,0,0,0.9))' }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompleteRef.current();
            }}
            className="absolute top-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full transition"
            style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8' }}
            title="Skip sting animation"
          >
            ✕ Dismiss
          </button>
        </div>
      </div>
    );
  }

  // ── BUILT-IN MOTION GRAPHICS ──

  const renderGraphic = () => {

    // ── FOUR ──
    if (eventKey === 'four') {
      return (
        <div className="flex flex-col items-center gap-4 animate-zoom-in">
          {/* Top label */}
          <div
            className="text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full"
            style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', letterSpacing: '0.3em', border: '1px solid rgba(250,204,21,0.3)' }}
          >
            BOUNDARY
          </div>

          {/* Main card */}
          <div
            className="relative overflow-hidden rounded-2xl px-16 py-5"
            style={{
              background: 'linear-gradient(135deg, #070d1e 0%, #0e1938 35%, #1e3a8a 65%, #0f172a 100%)',
              boxShadow: '0 0 100px rgba(30,58,138,0.9), 0 0 40px rgba(250,204,21,0.3)',
              border: '2px solid rgba(250,204,21,0.6)',
            }}
          >
            {/* Shimmer sweep */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(105deg, transparent 30%, rgba(250,204,21,0.4) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.2s ease-out',
              }}
            />
            <span
              className="relative z-10 font-black uppercase"
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: '6.5rem',
                lineHeight: 1,
                color: '#ffffff',
                textShadow: '0 4px 30px rgba(0,0,0,0.8), 0 0 20px rgba(250,204,21,0.5)',
                letterSpacing: '0.08em',
              }}
            >
              FOUR!
            </span>
          </div>

          {/* Sub label */}
          <div
            className="text-xl font-black tracking-wider"
            style={{
              color: '#facc15',
              textShadow: '0 0 20px rgba(250,204,21,0.8)',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.15em',
            }}
          >
            4️⃣ CRACKING BOUNDARY
          </div>
        </div>
      );
    }

    // ── SIX ──
    if (eventKey === 'six') {
      return (
        <div className="flex flex-col items-center gap-4 animate-zoom-in">
          <div
            className="text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full"
            style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', letterSpacing: '0.3em', border: '1px solid rgba(250,204,21,0.3)' }}
          >
            MAXIMUM
          </div>

          <div
            className="relative overflow-hidden rounded-2xl px-16 py-5"
            style={{
              background: 'linear-gradient(135deg, #1c050a 0%, #3d0812 30%, #7f1d1d 65%, #24050c 100%)',
              boxShadow: '0 0 120px rgba(127,29,29,0.95), 0 0 50px rgba(250,204,21,0.4)',
              border: '2px solid rgba(250,204,21,0.7)',
            }}
          >
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background: 'linear-gradient(105deg, transparent 20%, rgba(250,204,21,0.6) 50%, transparent 80%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1s ease-out',
              }}
            />
            <span
              className="relative z-10 font-black uppercase"
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: '6.5rem',
                lineHeight: 1,
                color: '#fde047',
                textShadow: '0 0 40px rgba(250,204,21,0.9), 0 4px 20px rgba(0,0,0,0.8)',
                letterSpacing: '0.06em',
              }}
            >
              SIX!
            </span>
          </div>

          <div
            className="text-xl font-black tracking-wider"
            style={{
              color: '#ffffff',
              textShadow: '0 0 25px rgba(250,204,21,0.8)',
              letterSpacing: '0.15em',
            }}
          >
            🚀 OUT OF THE GROUND — MAXIMUM!
          </div>
        </div>
      );
    }

    // ── WICKET ──
    if (['bowled','caught','caught_behind','caught_and_bowled','lbw','stumped','run_out',
         'hit_wicket','duck_out','golden_duck','generic_wicket'].includes(eventKey)) {
      const label = (() => {
        const map: Record<string, string> = {
          bowled: 'CLEAN BOWLED',
          caught: 'CAUGHT OUT',
          caught_behind: 'CAUGHT BEHIND',
          caught_and_bowled: 'CAUGHT & BOWLED',
          lbw: 'LEG BEFORE WICKET',
          stumped: 'STUMPED!',
          run_out: 'RUN OUT!',
          hit_wicket: 'HIT WICKET',
          duck_out: 'DUCK — BOWLED!',
          golden_duck: '🦆 GOLDEN DUCK!',
          generic_wicket: 'WICKET!',
        };
        return map[eventKey] || eventKey.replace(/_/g, ' ').toUpperCase();
      })();

      return (
        <div className="flex flex-col items-center gap-4" style={{ animation: 'wicketShake 0.6s ease-out, zoomIn 0.4s ease-out' }}>
          <div
            className="text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full"
            style={{ background: 'rgba(127,29,29,0.4)', color: '#facc15', letterSpacing: '0.3em', border: '1px solid rgba(250,204,21,0.4)' }}
          >
            WICKET
          </div>

          <div
            className="relative overflow-hidden rounded-2xl px-16 py-5"
            style={{
              background: 'linear-gradient(135deg, #1c050a 0%, #450a0a 30%, #7f1d1d 65%, #24050c 100%)',
              boxShadow: '0 0 120px rgba(127,29,29,0.95), 0 0 50px rgba(250,204,21,0.4)',
              border: '2px solid rgba(250,204,21,0.6)',
            }}
          >
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background: 'linear-gradient(105deg, transparent 20%, rgba(250,204,21,0.5) 50%, transparent 80%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 0.8s ease-out',
              }}
            />
            <span
              className="relative z-10 font-black uppercase"
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: '6.5rem',
                lineHeight: 1,
                color: '#ffffff',
                textShadow: '0 4px 30px rgba(0,0,0,0.8), 0 0 25px rgba(250,204,21,0.6)',
                letterSpacing: '0.08em',
              }}
            >
              OUT!
            </span>
          </div>

          <div
            className="relative overflow-hidden rounded-xl px-6 py-2"
            style={{
              background: 'rgba(14,25,56,0.9)',
              border: '1px solid rgba(250,204,21,0.5)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span
              className="font-black uppercase tracking-wider"
              style={{ color: '#facc15', fontSize: '1.2rem', textShadow: '0 0 15px rgba(250,204,21,0.6)', letterSpacing: '0.12em' }}
            >
              {customText || label}
            </span>
          </div>
        </div>
      );
    }

    // ── WIDE ──
    if (eventKey === 'wide') {
      return (
        <div className="flex flex-col items-center gap-3 animate-zoom-in">
          <div
            className="relative overflow-hidden rounded-2xl px-14 py-4"
            style={{
              background: 'linear-gradient(135deg, #070d1e 0%, #0e1938 50%, #172554 100%)',
              boxShadow: '0 0 80px rgba(250,204,21,0.5)',
              border: '2px solid rgba(250,204,21,0.7)',
            }}
          >
            <span
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: '4.5rem',
                fontWeight: 700,
                color: '#facc15',
                textShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 20px rgba(250,204,21,0.6)',
                letterSpacing: '0.08em',
              }}
            >
              WIDE BALL
            </span>
          </div>
          {customText && (
            <span className="text-lg font-bold" style={{ color: '#ffffff', letterSpacing: '0.1em' }}>{customText}</span>
          )}
        </div>
      );
    }

    // ── NO BALL ──
    if (eventKey === 'noball') {
      return (
        <div className="flex flex-col items-center gap-3 animate-zoom-in">
          <div
            className="relative overflow-hidden rounded-2xl px-10 py-4"
            style={{
              background: 'linear-gradient(135deg, #1c050a 0%, #450a0a 50%, #7f1d1d 100%)',
              boxShadow: '0 0 90px rgba(220,38,38,0.85), 0 0 30px rgba(250,204,21,0.5)',
              border: '2px solid rgba(250,204,21,0.7)',
            }}
          >
            <span
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: '4rem',
                fontWeight: 700,
                color: '#ffffff',
                textShadow: '0 0 25px rgba(0,0,0,0.8), 0 0 20px rgba(250,204,21,0.6)',
                letterSpacing: '0.06em',
              }}
            >
              NO BALL + FREE HIT!
            </span>
          </div>
          <div
            className="text-base font-black px-4 py-1 rounded-full"
            style={{
              background: 'rgba(127,29,29,0.5)',
              color: '#fde047',
              border: '1px solid rgba(250,204,21,0.6)',
              letterSpacing: '0.1em',
            }}
          >
            ⚡ BATTER CANNOT BE DISMISSED ⚡
          </div>
          {customText && (
            <span className="text-lg font-bold" style={{ color: '#ffffff' }}>{customText}</span>
          )}
        </div>
      );
    }

    // ── HALF CENTURY / CENTURY ──
    if (eventKey === 'half_century' || eventKey === 'century') {
      const isCentury = eventKey === 'century';
      return (
        <div className="flex flex-col items-center gap-4 animate-zoom-in">
          <div
            className="text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full"
            style={{
              background: 'rgba(250,204,21,0.2)',
              color: '#facc15',
              letterSpacing: '0.3em',
              border: '1px solid rgba(250,204,21,0.5)',
            }}
          >
            {isCentury ? '100 RUNS LANDMARK' : '50 RUNS LANDMARK'}
          </div>

          <div
            className="relative overflow-hidden rounded-2xl px-16 py-5"
            style={{
              background: isCentury
                ? 'linear-gradient(135deg, #1c050a 0%, #7f1d1d 40%, #0e1938 100%)'
                : 'linear-gradient(135deg, #070d1e 0%, #0e1938 50%, #1e3a8a 100%)',
              boxShadow: '0 0 120px rgba(250,204,21,0.9), 0 0 50px rgba(250,204,21,0.5)',
              border: '2px solid rgba(250,204,21,0.8)',
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(105deg, transparent 20%, rgba(250,204,21,0.6) 50%, transparent 80%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-out',
              }}
            />
            <span
              className="relative z-10 font-black"
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: isCentury ? '5.5rem' : '5rem',
                lineHeight: 1,
                color: '#fde047',
                textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(250,204,21,0.7)',
                letterSpacing: '0.06em',
              }}
            >
              {isCentury ? '100 — CENTURY!' : '50 RUNS!'}
            </span>
          </div>

          <div
            className="text-lg font-black tracking-wider"
            style={{
              color: '#ffffff',
              textShadow: '0 0 20px rgba(250,204,21,0.8)',
              letterSpacing: '0.12em',
            }}
          >
            {customText || (isCentury ? '🏏 BRILLIANT CENTURY!' : '🏏 GREAT HALF-CENTURY!')}
          </div>
        </div>
      );
    }

    // ── 5-WICKET HAUL ──
    if (eventKey === 'haul_5w') {
      return (
        <div className="flex flex-col items-center gap-4 animate-zoom-in">
          <div
            className="relative overflow-hidden rounded-2xl px-14 py-5"
            style={{
              background: 'linear-gradient(135deg, #070d1e 0%, #0e1938 50%, #1e3a8a 100%)',
              boxShadow: '0 0 120px rgba(30,58,138,0.9), 0 0 50px rgba(250,204,21,0.5)',
              border: '2px solid rgba(250,204,21,0.7)',
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'linear-gradient(105deg, transparent, rgba(250,204,21,0.5), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-out',
              }}
            />
            <span
              className="relative z-10 font-black uppercase"
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: '4rem',
                lineHeight: 1,
                color: '#fde047',
                textShadow: '0 0 40px rgba(250,204,21,0.8)',
                letterSpacing: '0.08em',
              }}
            >
              🎳 FIVE-WICKET HAUL!
            </span>
          </div>
          <div
            className="text-lg font-black"
            style={{ color: '#ffffff', letterSpacing: '0.12em', textShadow: '0 0 20px rgba(250,204,21,0.7)' }}
          >
            {customText || 'INCREDIBLE BOWLING PERFORMANCE'}
          </div>
        </div>
      );
    }

    // ── MATCH WON ──
    if (eventKey === 'match_won') {
      return (
        <div className="flex flex-col items-center gap-5 animate-zoom-in">
          <div
            className="relative overflow-hidden rounded-2xl px-16 py-6"
            style={{
              background: 'linear-gradient(135deg, #081026 0%, #1c050a 50%, #081026 100%)',
              boxShadow: '0 0 130px rgba(250,204,21,0.9), 0 0 40px rgba(250,204,21,0.5)',
              border: '2px solid rgba(250,204,21,0.8)',
            }}
          >
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background: 'linear-gradient(105deg, transparent, rgba(250,204,21,0.7), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-out',
              }}
            />
            <span
              className="relative z-10 font-black uppercase"
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: '5rem',
                lineHeight: 1,
                color: '#facc15',
                textShadow: '0 0 40px rgba(250,204,21,0.8)',
                letterSpacing: '0.1em',
              }}
            >
              {customText || '🏆 MATCH WON!'}
            </span>
          </div>
        </div>
      );
    }

    // ── GENERIC FALLBACK ──
    return (
      <div className="flex flex-col items-center gap-3 animate-zoom-in">
        <div
          className="rounded-2xl px-12 py-4"
          style={{
            background: 'linear-gradient(135deg, #070d1e 0%, #1c050a 100%)',
            border: '2px solid rgba(250,204,21,0.5)',
            boxShadow: '0 0 50px rgba(0,0,0,0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span
            className="font-black uppercase"
            style={{
              fontFamily: "'Teko', sans-serif",
              fontSize: '4rem',
              color: '#facc15',
              textShadow: '0 0 30px rgba(250,204,21,0.6)',
              letterSpacing: '0.1em',
            }}
          >
            {customText || eventKey.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={() => onCompleteRef.current()}
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer select-none transition-opacity"
      style={{
        background: 'radial-gradient(circle at center, rgba(14,25,56,0.85) 0%, rgba(26,4,8,0.92) 100%)',
        backdropFilter: 'blur(8px)',
      }}
      title="Click anywhere to dismiss animation"
    >
      <div className="relative pointer-events-auto flex flex-col items-center">
        {renderGraphic()}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCompleteRef.current();
          }}
          className="mt-6 text-xs font-bold text-yellow-300 hover:text-white px-4 py-1.5 rounded-full bg-[#0e1938] hover:bg-[#152554] border border-yellow-500/40 transition shadow-lg cursor-pointer"
        >
          ✕ Dismiss (Auto-closing)
        </button>
      </div>
    </div>
  );
};
