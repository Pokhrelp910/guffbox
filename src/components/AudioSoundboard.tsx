// The Cricket Guff Studio — Live Stadium Audio Engine & Broadcaster Soundboard

import React, { useState } from 'react';
import { stadiumAudio } from '../utils/soundEffects';
import { broadcastSync } from '../utils/broadcastSync';
import { Volume2, VolumeX, Radio } from 'lucide-react';

interface AudioSoundboardProps {
  compact?: boolean;
}

export const AudioSoundboard: React.FC<AudioSoundboardProps> = ({ compact = false }) => {
  const [isAmbientOn, setIsAmbientOn] = useState<boolean>(false);
  const [ambientVol, setAmbientVol] = useState<number>(0.15);
  const [activePad, setActivePad] = useState<string | null>(null);

  const toggleAmbient = () => {
    if (isAmbientOn) {
      stadiumAudio.stopAmbientCrowd();
      setIsAmbientOn(false);
      broadcastSync.publish({ type: 'TOGGLE_AMBIENT_CROWD', active: false });
    } else {
      stadiumAudio.startAmbientCrowd(ambientVol);
      setIsAmbientOn(true);
      broadcastSync.publish({ type: 'TOGGLE_AMBIENT_CROWD', active: true, volume: ambientVol });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setAmbientVol(vol);
    if (isAmbientOn) {
      stadiumAudio.setAmbientVolume(vol);
      broadcastSync.publish({ type: 'TOGGLE_AMBIENT_CROWD', active: true, volume: vol });
    }
  };

  const triggerSound = (
    name: string,
    soundKey: 'cheer' | 'airhorn' | 'appeal' | 'clap' | 'whistle' | 'fanfare'
  ) => {
    setActivePad(name);
    setTimeout(() => setActivePad(null), 600);

    // Play locally
    if (soundKey === 'cheer') stadiumAudio.playCrowdCheer();
    else if (soundKey === 'airhorn') stadiumAudio.playAirhorn();
    else if (soundKey === 'appeal') stadiumAudio.playAppeal();
    else if (soundKey === 'clap') stadiumAudio.playClapping();
    else if (soundKey === 'whistle') stadiumAudio.playWhistle();
    else if (soundKey === 'fanfare') stadiumAudio.playFanfare();

    // Broadcast to OBS and YouTube Stream audio mix
    broadcastSync.publish({ type: 'TRIGGER_SOUND', sound: soundKey });
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 bg-gradient-to-r from-[#081026] to-[#1c050a] border border-yellow-500/30 px-3 py-1.5 rounded-xl shadow text-xs">
        {/* Ambient Crowd Toggle */}
        <button
          onClick={toggleAmbient}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold transition ${
            isAmbientOn
              ? 'bg-yellow-400 text-[#050a18] shadow-[0_0_10px_rgba(250,204,21,0.5)]'
              : 'bg-[#0e1938] text-white hover:text-yellow-300 border border-yellow-500/30'
          }`}
          title="Toggle Continuous Stadium Ambient Crowd Noise on Stream"
        >
          {isAmbientOn ? <Volume2 className="w-3.5 h-3.5 text-[#050a18]" /> : <VolumeX className="w-3.5 h-3.5 text-yellow-400" />}
          <span>Crowd {isAmbientOn ? 'ON' : 'OFF'}</span>
        </button>

        {/* Mini Sound Pads */}
        <button
          onClick={() => triggerSound('horn', 'airhorn')}
          className="bg-[#0e1938] hover:bg-[#1a2c63] text-yellow-300 border border-yellow-500/30 px-2 py-1 rounded-lg font-bold transition text-[11px]"
          title="IPL Stadium Trumpet / Airhorn"
        >
          📣 Horn
        </button>
        <button
          onClick={() => triggerSound('cheer', 'cheer')}
          className="bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 border border-yellow-500/30 px-2 py-1 rounded-lg font-bold transition text-[11px]"
          title="Roaring Crowd Cheer"
        >
          🙌 Cheer
        </button>
        <button
          onClick={() => triggerSound('appeal', 'appeal')}
          className="bg-[#24060e] hover:bg-[#3d0a17] text-yellow-300 border border-yellow-500/30 px-2 py-1 rounded-lg font-bold transition text-[11px]"
          title="Howzat Appeal Shout"
        >
          ⚡ Howzat!
        </button>
        <button
          onClick={() => triggerSound('clap', 'clap')}
          className="bg-[#0e1938] hover:bg-[#1a2c63] text-white hover:text-yellow-300 border border-yellow-500/30 px-2 py-1 rounded-lg font-bold transition text-[11px]"
          title="Rhythmic Stadium Clapping"
        >
          👏 Clap
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#081026] via-[#050a18] to-[#1c050a] border border-yellow-500/30 rounded-2xl p-3.5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-yellow-500/20 mb-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-yellow-400 uppercase tracking-wider">
          <Radio className="w-4 h-4 text-yellow-400" />
          <span>Broadcast Stadium Audio Engine</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Ambient crowd toggle */}
          <button
            onClick={toggleAmbient}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition shadow ${
              isAmbientOn
                ? 'bg-yellow-400 text-[#050a18] shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                : 'bg-[#0e1938] text-white hover:text-yellow-300 border border-yellow-500/30'
            }`}
          >
            {isAmbientOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isAmbientOn ? 'Stadium Ambience: LIVE' : 'Stadium Ambience: MUTED'}</span>
          </button>
          {isAmbientOn && (
            <input
              type="range"
              min="0.02"
              max="0.4"
              step="0.02"
              value={ambientVol}
              onChange={handleVolumeChange}
              className="w-20 accent-yellow-400 cursor-pointer"
              title="Adjust crowd ambient volume"
            />
          )}
        </div>
      </div>

      {/* Soundboard Pads Grid */}
      <div className="grid grid-cols-6 gap-2">
        <button
          onClick={() => triggerSound('horn', 'airhorn')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            activePad === 'horn'
              ? 'scale-95 bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
              : 'bg-[#0e1938] hover:bg-[#152554] text-yellow-300 border-yellow-500/30'
          }`}
        >
          <div className="text-lg">📣</div>
          <div className="text-[11px] font-black uppercase mt-1">Airhorn</div>
          <div className="text-[9px] text-white/70">IPL Anthem</div>
        </button>

        <button
          onClick={() => triggerSound('cheer', 'cheer')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            activePad === 'cheer'
              ? 'scale-95 bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
              : 'bg-[#14224c] hover:bg-[#1f3575] text-white border-yellow-500/30'
          }`}
        >
          <div className="text-lg">🙌</div>
          <div className="text-[11px] font-black uppercase mt-1">Roar</div>
          <div className="text-[9px] text-yellow-300/80">Crowd Cheer</div>
        </button>

        <button
          onClick={() => triggerSound('appeal', 'appeal')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            activePad === 'appeal'
              ? 'scale-95 bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
              : 'bg-[#24060e] hover:bg-[#3d0a17] text-white border-yellow-500/30'
          }`}
        >
          <div className="text-lg">⚡</div>
          <div className="text-[11px] font-black uppercase mt-1">Howzat!</div>
          <div className="text-[9px] text-yellow-300/80">Appeal Surge</div>
        </button>

        <button
          onClick={() => triggerSound('clap', 'clap')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            activePad === 'clap'
              ? 'scale-95 bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
              : 'bg-[#0e1938] hover:bg-[#152554] text-white border-yellow-500/30'
          }`}
        >
          <div className="text-lg">👏</div>
          <div className="text-[11px] font-black uppercase mt-1">Clapping</div>
          <div className="text-[9px] text-yellow-300/80">Stadium Clap</div>
        </button>

        <button
          onClick={() => triggerSound('whistle', 'whistle')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            activePad === 'whistle'
              ? 'scale-95 bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
              : 'bg-[#24060e] hover:bg-[#3d0a17] text-yellow-300 border-yellow-500/30'
          }`}
        >
          <div className="text-lg">🏁</div>
          <div className="text-[11px] font-black uppercase mt-1">Whistle</div>
          <div className="text-[9px] text-white/70">Umpire Whistle</div>
        </button>

        <button
          onClick={() => triggerSound('fanfare', 'fanfare')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            activePad === 'fanfare'
              ? 'scale-95 bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
              : 'bg-[#14224c] hover:bg-[#1f3575] text-yellow-300 border-yellow-500/30'
          }`}
        >
          <div className="text-lg">🎺</div>
          <div className="text-[11px] font-black uppercase mt-1">Fanfare</div>
          <div className="text-[9px] text-white/70">Milestone Chords</div>
        </button>
      </div>
    </div>
  );
};
