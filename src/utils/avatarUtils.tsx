// The Cricket Guff Studio — Cartoon Avatar & Team Logo Utility Engine
// Provides high-contrast, broadcast-ready default cartoon avatars for players and crest logos for teams

import React, { useState, useEffect } from 'react';

/**
 * Deterministic string hash helper
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates an SVG data URL for a default cartoon cricketer avatar.
 * Deterministic based on player name so each player has a consistent, lively cartoon appearance.
 */
export function getDefaultPlayerAvatar(
  name: string,
  role: string = 'batsman',
  teamColor: string = '#1e3a8a'
): string {
  const hash = hashString(name || 'Player');
  
  // Palette options
  const skinTones = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
  const skin = skinTones[hash % skinTones.length];
  
  // Cap vs Helmet
  const hasHelmet = (hash % 3) === 0;
  const jerseyColor = teamColor || '#1e3a8a';
  const visorColor = '#334155';
  
  // Role icon or accent
  const roleEmoji =
    role === 'bowler' ? '🎯' : role === 'wicket-keeper' ? '🧤' : role === 'all-rounder' ? '⚡' : '🏏';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${jerseyColor}"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
      </filter>
    </defs>

    <!-- Circular Background -->
    <circle cx="50" cy="50" r="48" fill="url(#bgGrad)" stroke="${jerseyColor}" stroke-width="2.5"/>

    <!-- Jersey Body & Shoulders -->
    <path d="M 22 92 C 22 72, 36 68, 50 68 C 64 68, 78 72, 78 92 Z" fill="url(#capGrad)" filter="url(#shadow)"/>
    
    <!-- Jersey Collar -->
    <polygon points="43,68 50,78 57,68 50,65" fill="#facc15"/>
    <path d="M 36 70 L 44 76 L 40 85 Z" fill="#ffffff" opacity="0.8"/>
    <path d="M 64 70 L 56 76 L 60 85 Z" fill="#ffffff" opacity="0.8"/>

    <!-- Neck -->
    <rect x="44" y="55" width="12" height="15" rx="3" fill="${skin}"/>

    <!-- Head / Face -->
    <ellipse cx="50" cy="46" rx="19" ry="20" fill="${skin}" filter="url(#shadow)"/>

    <!-- Ears -->
    <circle cx="31" cy="47" r="4" fill="${skin}"/>
    <circle cx="69" cy="47" r="4" fill="${skin}"/>

    ${
      hasHelmet
        ? `<!-- Cricket Helmet -->
           <path d="M 31 43 C 31 24, 69 24, 69 43 Z" fill="url(#capGrad)"/>
           <!-- Helmet Brim -->
           <path d="M 28 42 C 38 38, 62 38, 72 42 L 70 45 C 60 41, 40 41, 30 45 Z" fill="#0f172a"/>
           <!-- Protective Grille Bars -->
           <path d="M 36 45 L 36 60 C 44 64, 56 64, 64 60 L 64 45" fill="none" stroke="${visorColor}" stroke-width="2.2" stroke-linecap="round"/>
           <line x1="36" y1="52" x2="64" y2="52" stroke="${visorColor}" stroke-width="2"/>
           <line x1="42" y1="46" x2="42" y2="58" stroke="${visorColor}" stroke-width="1.5"/>
           <line x1="58" y1="46" x2="58" y2="58" stroke="${visorColor}" stroke-width="1.5"/>`
        : `<!-- Cricket Cap -->
           <path d="M 31 40 C 31 25, 69 25, 69 40 Z" fill="url(#capGrad)"/>
           <!-- Cap Visor / Peak -->
           <path d="M 28 39 Q 50 33 72 39 Q 50 43 28 39 Z" fill="#0f172a" filter="url(#shadow)"/>
           <!-- Cap Button & Eyelets -->
           <circle cx="50" cy="27" r="2.5" fill="#facc15"/>`
    }

    <!-- Eyes (Cartoon Expressive) -->
    <ellipse cx="43" cy="45" rx="2.5" ry="3.5" fill="#1e293b"/>
    <ellipse cx="57" cy="45" rx="2.5" ry="3.5" fill="#1e293b"/>
    <!-- Eye Highlights -->
    <circle cx="44" cy="44" r="1" fill="#ffffff"/>
    <circle cx="58" cy="44" r="1" fill="#ffffff"/>

    <!-- Eyebrows -->
    <path d="M 39 40 Q 43 38 47 40" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M 53 40 Q 57 38 61 40" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>

    <!-- Cute Nose & Smile -->
    <circle cx="50" cy="49" r="1.5" fill="#d97706"/>
    <path d="M 45 54 Q 50 58 55 54" fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round"/>

    <!-- Cheek Blush -->
    <circle cx="39" cy="51" r="2" fill="#f43f5e" opacity="0.4"/>
    <circle cx="61" cy="51" r="2" fill="#f43f5e" opacity="0.4"/>

    <!-- Mini Role Badge Pin on Corner -->
    <circle cx="78" cy="78" r="12" fill="#0f172a" stroke="#facc15" stroke-width="1.5"/>
    <text x="78" y="82.5" font-size="10" text-anchor="middle" dominant-baseline="central">${roleEmoji}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an SVG data URL for a default cartoon franchise cricket crest / team logo.
 * Deterministic based on team name and short code.
 */
export function getDefaultTeamLogo(
  name: string,
  shortName: string,
  color: string = '#1e3a8a'
): string {
  const code = (shortName || name.slice(0, 3) || 'TM').trim().toUpperCase().slice(0, 4);
  const primaryColor = color || '#1e3a8a';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#facc15"/>
        <stop offset="100%" stop-color="#ca8a04"/>
      </linearGradient>
      <linearGradient id="batGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fed7aa"/>
        <stop offset="100%" stop-color="#c2410c"/>
      </linearGradient>
      <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
      </filter>
    </defs>

    <!-- Outer Gold Trim Shield -->
    <path d="M 50 6 L 86 16 C 86 60, 68 84, 50 94 C 32 84, 14 60, 14 16 Z"
          fill="url(#goldGrad)" filter="url(#logoShadow)"/>

    <!-- Inner Team Colored Shield -->
    <path d="M 50 10 L 82 19 C 82 57, 65 79, 50 88 C 35 79, 18 57, 18 19 Z"
          fill="url(#shieldGrad)"/>

    <!-- Crossed Cartoon Bats -->
    <!-- Left Bat -->
    <g transform="rotate(-30 50 48)">
      <rect x="47.5" y="24" width="5" height="42" rx="2" fill="url(#batGrad)"/>
      <rect x="48.5" y="16" width="3" height="9" rx="1.5" fill="#facc15"/>
      <rect x="47.5" y="60" width="5" height="4" fill="#0f172a" opacity="0.3"/>
    </g>
    <!-- Right Bat -->
    <g transform="rotate(30 50 48)">
      <rect x="47.5" y="24" width="5" height="42" rx="2" fill="url(#batGrad)"/>
      <rect x="48.5" y="16" width="3" height="9" rx="1.5" fill="#facc15"/>
      <rect x="47.5" y="60" width="5" height="4" fill="#0f172a" opacity="0.3"/>
    </g>

    <!-- Shiny Cartoon Cricket Ball -->
    <circle cx="50" cy="46" r="11" fill="#dc2626" stroke="#ffffff" stroke-width="1.2" filter="url(#logoShadow)"/>
    <!-- Ball Seam Stitching -->
    <path d="M 43 41 Q 50 46 43 51" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="1.5,1.5"/>
    <path d="M 57 41 Q 50 46 57 51" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="1.5,1.5"/>
    <ellipse cx="46" cy="42" rx="2.5" ry="1.5" fill="#ffffff" opacity="0.6"/>

    <!-- 3 Golden Stars on Top Crest -->
    <polygon points="50,11 51.5,15 55.5,15 52,17.5 53.5,21.5 50,19 46.5,21.5 48,17.5 44.5,15 48.5,15" fill="#fef08a"/>
    <polygon points="36,15 37.2,18 40.5,18 37.8,20 38.8,23 36,21.2 33.2,23 34.2,20 31.5,18 34.8,18" fill="#facc15" transform="scale(0.85) translate(8,3)"/>
    <polygon points="64,15 65.2,18 68.5,18 65.8,20 66.8,23 64,21.2 61.2,23 62.2,20 59.5,18 62.8,18" fill="#facc15" transform="scale(0.85) translate(8,3)"/>

    <!-- Bottom Ribbon / Code Banner -->
    <path d="M 22 66 L 78 66 L 72 80 L 50 82 L 28 80 Z" fill="#090d16" stroke="url(#goldGrad)" stroke-width="1.5" filter="url(#logoShadow)"/>
    
    <!-- Team Short Code Text -->
    <text x="50" y="76" font-family="'Teko', Impact, Arial Black, sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      ${code}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Player Avatar Component
 * Renders custom photo if provided and loaded, otherwise seamlessly falls back to cartoon avatar.
 */
interface PlayerAvatarProps {
  name: string;
  photoUrl?: string;
  role?: string;
  teamColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  title?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  photoUrl,
  role = 'batsman',
  teamColor = '#1e3a8a',
  size = 'md',
  className = '',
  title,
}) => {
  const [loadError, setLoadError] = useState(false);

  // Reset load error if photoUrl changes
  useEffect(() => {
    setLoadError(false);
  }, [photoUrl]);

  const defaultAvatar = getDefaultPlayerAvatar(name, role, teamColor);
  const effectiveSrc = photoUrl && !loadError ? photoUrl : defaultAvatar;

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-slate-900 border border-white/20 shadow-md ${sizeClasses} ${className}`}
      title={title || `${name} (${role})`}
    >
      <img
        src={effectiveSrc}
        alt={name}
        onError={() => setLoadError(true)}
        className="w-full h-full object-cover rounded-full select-none"
        loading="lazy"
      />
    </div>
  );
};

/**
 * Team Logo Component
 * Renders custom logo if provided and loaded, otherwise seamlessly falls back to cartoon franchise crest.
 */
interface TeamLogoProps {
  name: string;
  shortName: string;
  logoUrl?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  title?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  name,
  shortName,
  logoUrl,
  color = '#1e3a8a',
  size = 'md',
  className = '',
  title,
}) => {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [logoUrl]);

  const defaultLogo = getDefaultTeamLogo(name, shortName, color);
  const effectiveSrc = logoUrl && !loadError ? logoUrl : defaultLogo;

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden flex-shrink-0 bg-slate-950/80 shadow ${sizeClasses} ${className}`}
      title={title || `${name} (${shortName})`}
    >
      <img
        src={effectiveSrc}
        alt={name}
        onError={() => setLoadError(true)}
        className="w-full h-full object-contain select-none"
        loading="lazy"
      />
    </div>
  );
};

/**
 * Compresses and converts an uploaded image File to a safe Base64 Data URL
 */
export function processImageUpload(
  file: File,
  maxDimension: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file (PNG, JPG, SVG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as WebP or JPEG for compact size
        const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
