// The Cricket Guff Studio — Social Media Match Summary Graphic & PNG Exporter
// Renders an esports-grade match summary card with instant 1080p PNG image download for social media

import React, { useRef } from 'react';
import { MatchState } from '../core/types';
import { calculateMatchRates } from '../core/target-calculator';
import { Trophy, Download, X, Award } from 'lucide-react';

interface SocialScorecardCardProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchState;
}

export const SocialScorecardCard: React.FC<SocialScorecardCardProps> = ({
  isOpen,
  onClose,
  match,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  if (!isOpen) return null;

  const inn1 = match.innings1;
  const inn2 = match.innings2;

  const teamA = match.teamA;
  const teamB = match.teamB;

  const inn1BatTeam = inn1.battingTeamId === teamA.id ? teamA : teamB;
  const inn1BowlTeam = inn1.bowlingTeamId === teamA.id ? teamA : teamB;

  const inn2BatTeam = inn2 ? (inn2.battingTeamId === teamA.id ? teamA : teamB) : inn1BowlTeam;
  const inn2BowlTeam = inn2 ? (inn2.bowlingTeamId === teamA.id ? teamA : teamB) : inn1BatTeam;

  // Innings 1 top performers
  const inn1Batters = Object.values(inn1.batterStats).sort((a, b) => b.runs - a.runs).slice(0, 2);
  const inn1Bowlers = Object.values(inn1.bowlerStats).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded).slice(0, 2);

  // Innings 2 top performers
  const inn2Batters = inn2 ? Object.values(inn2.batterStats).sort((a, b) => b.runs - a.runs).slice(0, 2) : [];
  const inn2Bowlers = inn2 ? Object.values(inn2.bowlerStats).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded).slice(0, 2) : [];

  const maxOvers = match.metadata.curtailedOvers || match.metadata.scheduledOvers;
  const rates = calculateMatchRates({
    currentRuns: inn2 ? inn2.totalRuns : inn1.totalRuns,
    legalBallsBowled: inn2 ? inn2.legalBalls : inn1.legalBalls,
    maxOvers,
    target: match.metadata.targetRuns,
    wickets: inn2 ? inn2.totalWickets : inn1.totalWickets,
    battingTeamName: inn2 ? inn2BatTeam.name : inn1BatTeam.name,
    bowlingTeamName: inn2 ? inn2BowlTeam.name : inn1BowlTeam.name,
    isFirstInnings: !inn2,
  });

  // Calculate Player of the Match
  let potmName = inn1Batters[0]?.name || 'Player of the Match';
  let potmReason = `${inn1Batters[0]?.runs || 0} runs (${inn1Batters[0]?.ballsFaced || 0}b)`;
  if (inn2Batters[0] && inn2Batters[0].runs > (inn1Batters[0]?.runs || 0)) {
    potmName = inn2Batters[0].name;
    potmReason = `${inn2Batters[0].runs} runs (${inn2Batters[0].ballsFaced}b)`;
  }

  // Draw 1200x675 HD Canvas snapshot for instant social sharing
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background (Dark Blue to Dark Red Brand Gradient)
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
    bgGrad.addColorStop(0, '#070d1e');
    bgGrad.addColorStop(0.5, '#220408');
    bgGrad.addColorStop(1, '#050916');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 675);

    // 2. Gold border
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 1160, 635);

    // 3. Header Tournament
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(match.metadata.tournamentName.toUpperCase(), 600, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${match.metadata.matchStage} • ${match.metadata.venue} • ${match.metadata.date}`, 600, 105);

    // 4. Result Title
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 36px sans-serif';
    const resultText = rates.matchResult || `${inn1BatTeam.name} ${inn1.totalRuns}/${inn1.totalWickets} vs ${inn2BatTeam.name}`;
    ctx.fillText(resultText, 600, 160);

    // 5. Divider
    ctx.strokeStyle = 'rgba(250,204,21,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 185);
    ctx.lineTo(1100, 185);
    ctx.stroke();

    // 6. Innings 1 Box (Left)
    ctx.fillStyle = 'rgba(8, 16, 38, 0.95)';
    ctx.fillRect(80, 210, 500, 300);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
    ctx.strokeRect(80, 210, 500, 300);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(inn1BatTeam.name.toUpperCase(), 110, 255);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(`${inn1.totalRuns}/${inn1.totalWickets}`, 110, 310);
    ctx.fillStyle = '#fde047';
    ctx.font = '20px sans-serif';
    ctx.fillText(`(${inn1.oversFormatted} / ${maxOvers} ov)`, 260, 305);

    // Innings 1 Batters
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TOP BATTERS:', 110, 355);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    inn1Batters.forEach((b, idx) => {
      ctx.fillText(`${b.name}: ${b.runs} (${b.ballsFaced}b) • 4s:${b.fours} 6s:${b.sixes}`, 110, 385 + idx * 26);
    });

    // Innings 1 Bowlers
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TOP BOWLERS:', 110, 450);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    inn1Bowlers.forEach((bw, idx) => {
      ctx.fillText(`${bw.name}: ${bw.wickets}/${bw.runsConceded} (${bw.oversFormatted} ov)`, 110, 475 + idx * 24);
    });

    // 7. Innings 2 Box (Right)
    ctx.fillStyle = 'rgba(28, 8, 16, 0.9)';
    ctx.fillRect(620, 210, 500, 300);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(620, 210, 500, 300);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(inn2 ? inn2BatTeam.name.toUpperCase() : inn1BowlTeam.name.toUpperCase(), 650, 255);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(inn2 ? `${inn2.totalRuns}/${inn2.totalWickets}` : 'Yet to Bat', 650, 310);
    if (inn2) {
      ctx.fillStyle = '#fef08a';
      ctx.font = '20px sans-serif';
      ctx.fillText(`(${inn2.oversFormatted} / ${maxOvers} ov)`, 800, 305);
    }

    // Innings 2 Batters
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TOP BATTERS:', 650, 355);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    if (inn2 && inn2Batters.length > 0) {
      inn2Batters.forEach((b, idx) => {
        ctx.fillText(`${b.name}: ${b.runs} (${b.ballsFaced}b) • 4s:${b.fours} 6s:${b.sixes}`, 650, 385 + idx * 26);
      });
    } else {
      ctx.fillText('—', 650, 385);
    }

    // Innings 2 Bowlers
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TOP BOWLERS:', 650, 450);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    if (inn2 && inn2Bowlers.length > 0) {
      inn2Bowlers.forEach((bw, idx) => {
        ctx.fillText(`${bw.name}: ${bw.wickets}/${bw.runsConceded} (${bw.oversFormatted} ov)`, 650, 475 + idx * 24);
      });
    } else {
      ctx.fillText('—', 650, 475);
    }

    // 8. POTM Footer Ribbon
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⭐ PLAYER OF THE MATCH: ${potmName.toUpperCase()} (${potmReason}) ⭐`, 600, 565);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px sans-serif';
    ctx.fillText('THE CRICKET GUFF STUDIO • OFFICIAL BROADCAST SCORECARD', 600, 615);

    // Trigger instant download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `match_summary_${inn1BatTeam.shortName}_vs_${inn1BowlTeam.shortName}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{
        background: 'radial-gradient(circle at center, rgba(14,25,56,0.92) 0%, rgba(26,4,8,0.96) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="w-full max-w-4xl bg-gradient-to-b from-[#081026] via-[#050a18] to-[#1c050a] border border-yellow-500/50 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
        style={{
          boxShadow: '0 0 60px rgba(0,0,0,0.95), 0 0 30px rgba(250,204,21,0.25)',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-[#0b1739] via-[#070e24] to-[#260810]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center font-black text-[#050a18] font-['Teko'] text-2xl shadow">
              GB
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wider text-yellow-400 font-['Teko'] uppercase">
                SOCIAL BROADCAST GRAPHIC
              </h2>
              <p className="text-xs text-white/80 -mt-1 font-medium">
                High-resolution scorecard export for YouTube, Instagram, and Twitter
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadImage}
              className="flex items-center space-x-1.5 bg-yellow-400 hover:bg-yellow-300 text-[#050a18] px-4 py-1.5 rounded-xl text-xs font-black shadow transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Image (PNG)</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 flex items-center justify-center transition border border-yellow-500/30 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Preview Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* Tournament Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 bg-yellow-400/10 border border-yellow-400/40 px-4 py-1.5 rounded-2xl mb-2 shadow">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="font-['Teko'] text-xl font-bold tracking-widest text-yellow-400 uppercase">
                {match.metadata.tournamentName}
              </span>
            </div>
            <p className="text-xs text-white/80 font-medium">
              {match.metadata.matchStage} • {match.metadata.venue} • {match.metadata.date}
            </p>
            <h1
              className="text-3xl font-black text-white font-['Teko'] tracking-wider mt-2"
              style={{ textShadow: '0 0 20px rgba(250,204,21,0.5)' }}
            >
              {rates.matchResult || `${inn1BatTeam.name} ${inn1.totalRuns}/${inn1.totalWickets} vs ${inn2BatTeam.name}`}
            </h1>
          </div>

          {/* Innings 1 vs Innings 2 Grid */}
          <div className="grid grid-cols-2 gap-5 mb-6">
            {/* Innings 1 Summary (Dark Blue Card) */}
            <div className="bg-[#0a142c] rounded-2xl p-4 border border-blue-900/60 shadow-xl">
              <div className="flex items-center space-x-3 pb-2.5 border-b border-blue-900/50 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow"
                  style={{ backgroundColor: inn1BatTeam.color || '#1e3a8a', color: '#fff' }}
                >
                  {inn1BatTeam.shortName}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{inn1BatTeam.name}</h3>
                  <p className="text-[10px] text-yellow-300 uppercase font-semibold">1st Innings</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-2xl font-black font-['Teko'] text-white">
                    {inn1.totalRuns} / {inn1.totalWickets}
                  </div>
                  <div className="text-[11px] text-yellow-400 font-mono font-bold">
                    {inn1.oversFormatted} ov
                  </div>
                </div>
              </div>

              {/* Batters */}
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-1">
                  🏏 Top Batters
                </div>
                <div className="space-y-1">
                  {inn1Batters.map((b) => (
                    <div key={b.playerId} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#050a18]/80 border border-blue-950">
                      <span className="font-bold text-white">{b.name}</span>
                      <span className="font-mono text-white">
                        <strong className="text-yellow-400">{b.runs}</strong> ({b.ballsFaced}b) • 4s:{b.fours} 6s:{b.sixes}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bowlers */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-1">
                  🎯 Top Bowlers
                </div>
                <div className="space-y-1">
                  {inn1Bowlers.map((bw) => (
                    <div key={bw.playerId} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#050a18]/80 border border-blue-950">
                      <span className="font-bold text-white">{bw.name}</span>
                      <span className="font-mono text-yellow-300 font-bold">
                        {bw.wickets}/{bw.runsConceded} ({bw.oversFormatted} ov)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Innings 2 Summary (Dark Red Card) */}
            <div className="bg-[#1c0810] rounded-2xl p-4 border border-red-950 shadow-xl">
              <div className="flex items-center space-x-3 pb-2.5 border-b border-red-900/50 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow"
                  style={{ backgroundColor: inn2BatTeam.color || '#7f1d1d', color: '#fff' }}
                >
                  {inn2BatTeam.shortName}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{inn2BatTeam.name}</h3>
                  <p className="text-[10px] text-yellow-300 uppercase font-semibold">2nd Innings</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-2xl font-black font-['Teko'] text-white">
                    {inn2 ? `${inn2.totalRuns} / ${inn2.totalWickets}` : 'Yet to Bat'}
                  </div>
                  {inn2 && (
                    <div className="text-[11px] text-yellow-400 font-mono font-bold">
                      {inn2.oversFormatted} ov
                    </div>
                  )}
                </div>
              </div>

              {/* Batters */}
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-1">
                  🏏 Top Batters
                </div>
                <div className="space-y-1">
                  {inn2 && inn2Batters.length > 0 ? (
                    inn2Batters.map((b) => (
                      <div key={b.playerId} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#0d0205]/80 border border-red-950">
                        <span className="font-bold text-white">{b.name}</span>
                        <span className="font-mono text-white">
                          <strong className="text-yellow-400">{b.runs}</strong> ({b.ballsFaced}b) • 4s:{b.fours} 6s:{b.sixes}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-white/60 italic py-1 px-2">Innings 2 not started</div>
                  )}
                </div>
              </div>

              {/* Bowlers */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-1">
                  🎯 Top Bowlers
                </div>
                <div className="space-y-1">
                  {inn2 && inn2Bowlers.length > 0 ? (
                    inn2Bowlers.map((bw) => (
                      <div key={bw.playerId} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#0d0205]/80 border border-red-950">
                        <span className="font-bold text-white">{bw.name}</span>
                        <span className="font-mono text-yellow-300 font-bold">
                          {bw.wickets}/{bw.runsConceded} ({bw.oversFormatted} ov)
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-white/60 italic py-1 px-2">Innings 2 not started</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* POTM Banner */}
          <div className="rounded-2xl p-4 border border-yellow-500/40 bg-gradient-to-r from-[#220408] via-[#091126] to-[#220408] flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-yellow-400">
                  PLAYER OF THE MATCH
                </div>
                <div className="text-lg font-black text-white leading-tight font-['Teko']">
                  {potmName.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="text-right font-mono font-bold text-yellow-300 text-sm">
              {potmReason}
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
