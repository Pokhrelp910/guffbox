// GuffBox Cricket Studio — Movable Circular Facecam / Host PiP Widget
// Floating, draggable circular live camera anchor positioned by default in the right-bottom corner

import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, Move, X } from 'lucide-react';

interface MovableCircularCamProps {
  streamerName?: string;
  isVisible?: boolean;
  onClose?: () => void;
}

export const MovableCircularCam: React.FC<MovableCircularCamProps> = ({
  streamerName = 'GUFFBOX HOST',
  isVisible = true,
  onClose,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Set default initial position to right-bottom corner once window size is known
  useEffect(() => {
    if (typeof window !== 'undefined' && position === null) {
      const defaultX = Math.max(20, window.innerWidth - 170); // ~24px from right
      const defaultY = Math.max(20, window.innerHeight - 250); // ~100px above ticker
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position]);

  // Clean up media stream when unmounting
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleCamera = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Webcam access was not granted or unavailable:', err);
        alert('Webcam permission not granted or device unavailable. You can also capture this circle via OBS Window Capture!');
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (position?.x || 0),
      y: e.clientY - (position?.y || 0),
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !position) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 160, e.clientX - dragStart.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 160, e.clientY - dragStart.y));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  if (!isVisible || position === null) return null;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 45,
        touchAction: 'none',
      }}
      className={`group select-none cursor-grab active:cursor-grabbing transition-transform ${
        isDragging ? 'scale-105 shadow-[0_0_40px_rgba(6,182,212,0.8)]' : 'hover:scale-102'
      }`}
      title="Drag to reposition circular camera anywhere on screen"
    >
      {/* Circular Glowing Container */}
      <div
        className="relative w-36 h-36 rounded-full overflow-hidden flex flex-col items-center justify-center border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.45)]"
        style={{
          background: 'radial-gradient(circle at 50% 40%, #0e1938 0%, #1c050a 100%)',
        }}
      >
        {/* Live Video Feed or Placeholder */}
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-full -scale-x-100" // Mirrored webcam
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 mb-1">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            {/* Equalizer animation */}
            <div className="flex items-end space-x-1 h-3 mt-1">
              <div className="w-1 bg-yellow-400 h-2 animate-pulse" />
              <div className="w-1 bg-yellow-400 h-3 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 bg-yellow-400 h-1.5 animate-pulse" style={{ animationDelay: '0.4s' }} />
              <div className="w-1 bg-yellow-400 h-2.5 animate-pulse" style={{ animationDelay: '0.1s' }} />
            </div>
          </div>
        )}

        {/* Reposition Drag Indicator (Shows on hover) */}
        <div className="absolute top-2 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="bg-black/70 text-yellow-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 border border-yellow-500/30">
            <Move className="w-2.5 h-2.5" />
            <span>Drag</span>
          </span>
        </div>

        {/* Streamer Name & Live Badge Pill */}
        <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
          <span
            className="max-w-[120px] truncate bg-[#050a18]/95 text-yellow-300 border border-yellow-500/40 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow"
            style={{ fontFamily: "'Teko', sans-serif", letterSpacing: '0.08em' }}
          >
            🔴 {streamerName}
          </span>
        </div>
      </div>

      {/* Floating Mini Controls (Right side of circle) */}
      <div className="absolute -top-1 -right-1 flex flex-col space-y-1 opacity-80 group-hover:opacity-100 transition-opacity">
        {/* Toggle Actual Webcam */}
        <button
          type="button"
          onClick={toggleCamera}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition shadow-lg border cursor-pointer ${
            isCameraActive
              ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-bold'
              : 'bg-[#0e1938] text-yellow-300 hover:text-white border-yellow-500/30 hover:border-yellow-400'
          }`}
          title={isCameraActive ? 'Turn Off Webcam' : 'Turn On Live Webcam Feed'}
        >
          {isCameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
        </button>

        {/* Close Widget */}
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-[#14224c] hover:bg-[#24060e] text-white hover:text-yellow-300 flex items-center justify-center transition border border-yellow-500/30 shadow cursor-pointer"
            title="Hide Floating Cam"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
