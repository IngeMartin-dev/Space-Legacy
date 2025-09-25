import React, { useRef, useEffect, useCallback } from 'react';

const ShipPreview = React.memo(({ ship, color }) => {
  const canvasRef = useRef(null);

  const drawShip = useCallback((ctx) => {
    ctx.clearRect(0, 0, 80, 50);
    ctx.save();
    ctx.translate(10, 5);
    
    ctx.fillStyle = color;
    const w = 60, h = 40;
    const x = 0, y = 0;
    
    switch (ship) {
      case 'ship1':
        // Classic Triangle Ship with glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w * 0.9, y + h * 0.8);
        ctx.lineTo(x + w / 2, y + h * 0.6);
        ctx.lineTo(x + w * 0.1, y + h * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Engine glow
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.7, w * 0.05, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ship2':
        // Stealth Fighter with angular design
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w * 0.85, y + h * 0.3);
        ctx.lineTo(x + w * 0.75, y + h * 0.8);
        ctx.lineTo(x + w * 0.6, y + h);
        ctx.lineTo(x + w * 0.4, y + h);
        ctx.lineTo(x + w * 0.25, y + h * 0.8);
        ctx.lineTo(x + w * 0.15, y + h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Wing details
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + w * 0.35, y + h * 0.4, w * 0.05, h * 0.3);
        ctx.fillRect(x + w * 0.6, y + h * 0.4, w * 0.05, h * 0.3);
        break;
      case 'ship3':
        // Saucer UFO with alien design
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Cockpit
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.15, h * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // Antenna
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(x + w / 2 - 1, y, 2, h * 0.2);
        break;
      case 'ship4':
        // Heavy Tank Ship with armor plating
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.fillRect(x + w * 0.1, y + h * 0.2, w * 0.8, h * 0.6);
        ctx.shadowBlur = 0;
        // Armor details
        ctx.fillStyle = '#666666';
        ctx.fillRect(x + w * 0.15, y + h * 0.3, w * 0.7, h * 0.1);
        ctx.fillRect(x + w * 0.15, y + h * 0.6, w * 0.7, h * 0.1);
        // Cannon
        ctx.fillStyle = '#444444';
        ctx.fillRect(x + w * 0.45, y, w * 0.1, h * 0.3);
        // Turret
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.4, w * 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ship5':
        // Phoenix Ship with flame effects
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.8, y + h*0.3);
        ctx.lineTo(x + w*0.9, y + h*0.8);
        ctx.lineTo(x + w*0.7, y + h);
        ctx.lineTo(x + w*0.3, y + h);
        ctx.lineTo(x + w*0.1, y + h*0.8);
        ctx.lineTo(x + w*0.2, y + h*0.3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Flame trails
        ctx.fillStyle = '#FF3300';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(x + w*0.7, y + h);
        ctx.lineTo(x + w*0.75, y + h + h*0.2);
        ctx.lineTo(x + w*0.65, y + h + h*0.1);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w*0.3, y + h);
        ctx.lineTo(x + w*0.35, y + h + h*0.2);
        ctx.lineTo(x + w*0.25, y + h + h*0.1);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'ship6':
        // Cyber Ship with neon effects
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 8;
        ctx.fillRect(x + w*0.2, y + h*0.1, w*0.6, h*0.8);
        ctx.shadowBlur = 0;
        // Neon details
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(x + w*0.25, y + h*0.2, w*0.5, h*0.05);
        ctx.fillRect(x + w*0.25, y + h*0.75, w*0.5, h*0.05);
        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + w*0.35, y + h*0.3, w*0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w*0.65, y + h*0.3, w*0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ship7':
        // Crystal Ship with geometric patterns
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, w/2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Crystal facets
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y + h*0.2);
        ctx.lineTo(x + w*0.7, y + h*0.4);
        ctx.lineTo(x + w/2, y + h*0.6);
        ctx.lineTo(x + w*0.3, y + h*0.4);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        // Core
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, w*0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ship8':
        // Dragon Ship with scales and wings
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.9, y + h*0.4);
        ctx.lineTo(x + w*0.8, y + h*0.8);
        ctx.lineTo(x + w*0.6, y + h);
        ctx.lineTo(x + w*0.4, y + h);
        ctx.lineTo(x + w*0.2, y + h*0.8);
        ctx.lineTo(x + w*0.1, y + h*0.4);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Scale details
        ctx.fillStyle = '#CC5500';
        for(let i = 0; i < 5; i++) {
          ctx.fillRect(x + w*0.2 + i*w*0.12, y + h*0.3, w*0.08, h*0.05);
        }
        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + w*0.3, y + h*0.2, w*0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w*0.7, y + h*0.2, w*0.03, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'admin1':
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h * 0.7);
        ctx.lineTo(x + w * 0.7, y + h);
        ctx.lineTo(x + w * 0.3, y + h);
        ctx.lineTo(x, y + h * 0.7);
        ctx.closePath();
        break;
      case 'admin2':
        const s = 5, r1 = w / 2, r2 = r1 / 2.5, cx = x + w / 2, cy = y + h / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r1);
        for (let i = 0; i < 2 * s; i++) {
          const r = (i % 2 === 0) ? r1 : r2;
          const a = Math.PI * i / s - Math.PI / 2;
          ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        ctx.closePath();
        break;
      case 'heartShip':
        // Romantic Heart Ship with glowing effect
        ctx.shadowColor = '#FF1493';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y + h * 0.3);
        ctx.bezierCurveTo(x + w/2, y + h * 0.1, x + w * 0.1, y + h * 0.1, x + w * 0.1, y + h * 0.4);
        ctx.bezierCurveTo(x + w * 0.1, y + h * 0.6, x + w/2, y + h * 0.8, x + w/2, y + h);
        ctx.bezierCurveTo(x + w/2, y + h * 0.8, x + w * 0.9, y + h * 0.6, x + w * 0.9, y + h * 0.4);
        ctx.bezierCurveTo(x + w * 0.9, y + h * 0.1, x + w/2, y + h * 0.1, x + w/2, y + h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Heart sparkle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + w * 0.3, y + h * 0.4, w * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w * 0.7, y + h * 0.4, w * 0.03, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'starShip':
        // Star Fighter with cosmic design
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.6, y + h*0.3);
        ctx.lineTo(x + w, y + h*0.3);
        ctx.lineTo(x + w*0.7, y + h*0.6);
        ctx.lineTo(x + w*0.8, y + h);
        ctx.lineTo(x + w/2, y + h*0.8);
        ctx.lineTo(x + w*0.2, y + h);
        ctx.lineTo(x + w*0.3, y + h*0.6);
        ctx.lineTo(x, y + h*0.3);
        ctx.lineTo(x + w*0.4, y + h*0.3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Star core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + w/2, y + h*0.5, w*0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'rocketShip':
        // Classic Rocket with exhaust flames
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 8;
        ctx.fillRect(x + w*0.3, y, w*0.4, h*0.8);
        ctx.shadowBlur = 0;
        // Nose cone
        ctx.beginPath();
        ctx.moveTo(x + w*0.3, y);
        ctx.lineTo(x + w/2, y - h*0.1);
        ctx.lineTo(x + w*0.7, y);
        ctx.closePath();
        ctx.fill();
        // Fins
        ctx.fillRect(x + w*0.2, y + h*0.6, w*0.1, h*0.3);
        ctx.fillRect(x + w*0.7, y + h*0.6, w*0.1, h*0.3);
        // Exhaust flames
        ctx.fillStyle = '#FF0000';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + w*0.35, y + h*0.8);
        ctx.lineTo(x + w*0.4, y + h*1.2);
        ctx.lineTo(x + w*0.45, y + h*0.9);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w*0.55, y + h*0.8);
        ctx.lineTo(x + w*0.6, y + h*1.2);
        ctx.lineTo(x + w*0.65, y + h*0.9);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'ninjaShip':
        // Stealth Ninja Ship with dark theme
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.8, y + h*0.2);
        ctx.lineTo(x + w*0.9, y + h*0.6);
        ctx.lineTo(x + w*0.7, y + h);
        ctx.lineTo(x + w*0.3, y + h);
        ctx.lineTo(x + w*0.1, y + h*0.6);
        ctx.lineTo(x + w*0.2, y + h*0.2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Ninja mask details
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + w*0.4, y + h*0.3, w*0.2, h*0.1);
        ctx.fillRect(x + w*0.35, y + h*0.2, w*0.05, h*0.15);
        ctx.fillRect(x + w*0.6, y + h*0.2, w*0.05, h*0.15);
        break;
      case 'galaxyShip':
        // Galaxy Ship with swirling cosmic patterns
        ctx.shadowColor = '#8A2BE2';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h/2, w/2, h/3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Galaxy arms
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, w*0.3, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, w*0.2, Math.PI * 0.5, Math.PI * 2);
        ctx.stroke();
        // Core
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, w*0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'mechaShip':
        // Mecha Robot Ship with mechanical details
        ctx.shadowColor = '#C0C0C0';
        ctx.shadowBlur = 6;
        ctx.fillRect(x + w*0.25, y + h*0.1, w*0.5, h*0.7);
        ctx.shadowBlur = 0;
        // Head
        ctx.fillRect(x + w*0.35, y, w*0.3, h*0.2);
        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + w*0.4, y + h*0.05, w*0.05, h*0.05);
        ctx.fillRect(x + w*0.55, y + h*0.05, w*0.05, h*0.05);
        // Arms
        ctx.fillStyle = color;
        ctx.fillRect(x + w*0.15, y + h*0.2, w*0.1, h*0.4);
        ctx.fillRect(x + w*0.75, y + h*0.2, w*0.1, h*0.4);
        // Legs
        ctx.fillRect(x + w*0.3, y + h*0.8, w*0.1, h*0.2);
        ctx.fillRect(x + w*0.6, y + h*0.8, w*0.1, h*0.2);
        break;
      case 'phoenixShip':
        // Majestic Phoenix Ship with fiery wings and rebirth theme
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.8, y + h*0.2);
        ctx.lineTo(x + w*0.9, y + h*0.5);
        ctx.lineTo(x + w*0.7, y + h*0.8);
        ctx.lineTo(x + w*0.6, y + h);
        ctx.lineTo(x + w*0.4, y + h);
        ctx.lineTo(x + w*0.3, y + h*0.8);
        ctx.lineTo(x + w*0.1, y + h*0.5);
        ctx.lineTo(x + w*0.2, y + h*0.2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Phoenix wing flames
        ctx.fillStyle = '#FF6600';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + w*0.8, y + h*0.3);
        ctx.lineTo(x + w*0.95, y + h*0.1);
        ctx.lineTo(x + w*0.9, y + h*0.6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w*0.2, y + h*0.3);
        ctx.lineTo(x + w*0.05, y + h*0.1);
        ctx.lineTo(x + w*0.1, y + h*0.6);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        // Phoenix eyes
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + w*0.35, y + h*0.25, w*0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w*0.65, y + h*0.25, w*0.03, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'quantumShip':
        // Quantum Ship with particle effects and energy fields
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.8, y + h*0.3);
        ctx.lineTo(x + w*0.9, y + h*0.7);
        ctx.lineTo(x + w*0.6, y + h);
        ctx.lineTo(x + w*0.4, y + h);
        ctx.lineTo(x + w*0.1, y + h*0.7);
        ctx.lineTo(x + w*0.2, y + h*0.3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Quantum particles
        ctx.fillStyle = '#FFFFFF';
        for(let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const radius = w * 0.15;
          ctx.beginPath();
          ctx.arc(x + w/2 + Math.cos(angle) * radius, y + h/2 + Math.sin(angle) * radius, w*0.02, 0, Math.PI * 2);
          ctx.fill();
        }
        // Energy core
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, w*0.06, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'voidShip':
        // Void Ship with dark matter effects and mysterious aura
        ctx.shadowColor = '#8A2BE2';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.85, y + h*0.25);
        ctx.lineTo(x + w*0.95, y + h*0.6);
        ctx.lineTo(x + w*0.75, y + h*0.9);
        ctx.lineTo(x + w*0.6, y + h);
        ctx.lineTo(x + w*0.4, y + h);
        ctx.lineTo(x + w*0.25, y + h*0.9);
        ctx.lineTo(x + w*0.05, y + h*0.6);
        ctx.lineTo(x + w*0.15, y + h*0.25);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Void particles
        ctx.fillStyle = '#9370DB';
        ctx.globalAlpha = 0.6;
        for(let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.arc(x + w*0.2 + i*w*0.1, y + h*0.4 + Math.sin(i) * h*0.1, w*0.025, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Void core
        ctx.fillStyle = '#4B0082';
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, w*0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'neonShip':
        // Neon Cyberpunk Ship with vibrant electric effects
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 12;
        ctx.fillRect(x + w*0.2, y + h*0.1, w*0.6, h*0.8);
        ctx.shadowBlur = 0;
        // Neon outlines
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + w*0.2, y + h*0.1, w*0.6, h*0.8);
        ctx.strokeRect(x + w*0.25, y + h*0.15, w*0.5, h*0.7);
        // Neon details
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(x + w*0.3, y + h*0.2, w*0.4, h*0.05);
        ctx.fillRect(x + w*0.3, y + h*0.75, w*0.4, h*0.05);
        // Electric arcs
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w*0.35, y + h*0.8);
        ctx.lineTo(x + w*0.4, y + h*0.9);
        ctx.lineTo(x + w*0.45, y + h*0.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w*0.65, y + h*0.8);
        ctx.lineTo(x + w*0.6, y + h*0.9);
        ctx.lineTo(x + w*0.55, y + h*0.85);
        ctx.stroke();
        break;
      case 'cosmicShip':
        // Cosmic Explorer Ship with starfield and celestial design
        ctx.shadowColor = '#4169E1';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.75, y + h*0.3);
        ctx.lineTo(x + w*0.85, y + h*0.7);
        ctx.lineTo(x + w*0.6, y + h);
        ctx.lineTo(x + w*0.4, y + h);
        ctx.lineTo(x + w*0.15, y + h*0.7);
        ctx.lineTo(x + w*0.25, y + h*0.3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Starfield
        ctx.fillStyle = '#FFFFFF';
        const stars = [
          [0.3, 0.3], [0.7, 0.2], [0.5, 0.5], [0.2, 0.7], [0.8, 0.6], [0.6, 0.8]
        ];
        stars.forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(x + w*sx, y + h*sy, w*0.015, 0, Math.PI * 2);
          ctx.fill();
        });
        // Navigation lights
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + w*0.2, y + h*0.4, w*0.02, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(x + w*0.8, y + h*0.4, w*0.02, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'stormShip':
        // Storm Ship with lightning effects and thunder theme
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.8, y + h*0.2);
        ctx.lineTo(x + w*0.9, y + h*0.6);
        ctx.lineTo(x + w*0.7, y + h*0.9);
        ctx.lineTo(x + w*0.6, y + h);
        ctx.lineTo(x + w*0.4, y + h);
        ctx.lineTo(x + w*0.3, y + h*0.9);
        ctx.lineTo(x + w*0.1, y + h*0.6);
        ctx.lineTo(x + w*0.2, y + h*0.2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Lightning bolts
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w*0.35, y + h*0.3);
        ctx.lineTo(x + w*0.4, y + h*0.4);
        ctx.lineTo(x + w*0.35, y + h*0.5);
        ctx.lineTo(x + w*0.4, y + h*0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w*0.65, y + h*0.3);
        ctx.lineTo(x + w*0.6, y + h*0.4);
        ctx.lineTo(x + w*0.65, y + h*0.5);
        ctx.lineTo(x + w*0.6, y + h*0.6);
        ctx.stroke();
        // Storm clouds
        ctx.fillStyle = '#808080';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x + w*0.3, y + h*0.2, w*0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w*0.7, y + h*0.2, w*0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      default:
        // Default modern ship
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w*0.9, y + h*0.7);
        ctx.lineTo(x + w*0.7, y + h);
        ctx.lineTo(x + w*0.3, y + h);
        ctx.lineTo(x + w*0.1, y + h*0.7);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Default engine glow
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(x + w/2, y + h*0.8, w*0.04, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fill();
    ctx.restore();
  }, [ship, color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawShip(ctx);
    }
  }, [drawShip]);

  return <canvas ref={canvasRef} width="80" height="50" className="bg-black/20 rounded-lg mx-auto" />;
});

export default ShipPreview;