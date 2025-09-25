import React, { useRef, useEffect, useCallback } from 'react';
import { useState } from 'react';

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 800;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 40; 
const ENEMY_WIDTH = 40; 
const ENEMY_HEIGHT = 40; 

const GameCanvas = ({
  players,
  enemies,
  bullets,
  powerups,
  coins,
  explosions,
  keysRef,
  level,
  gameSeed
}) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef();
  const starfield = useRef([]);
  const nebula = useRef([]);
  const comets = useRef([]);
  const planets = useRef([]);
  const clickCounter = useRef(0);

  useEffect(() => {
    // Función para generar números pseudo-aleatorios basados en semilla
    const seededRandom = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Usar gameSeed para sincronización perfecta, o nivel como fallback
    const seed = gameSeed || level || 1;

    // Generar campo de estrellas dinámico sincronizado
    starfield.current = Array.from({ length: 300 }, (_, i) => ({
      x: seededRandom(seed + i * 1) * CANVAS_WIDTH,
      y: seededRandom(seed + i * 2) * CANVAS_HEIGHT,
      size: seededRandom(seed + i * 3) * 2 + 0.5,
      speed: seededRandom(seed + i * 4) * 2 + 0.5,
      color: `hsl(${seededRandom(seed + i * 5) * 360}, 80%, ${60 + seededRandom(seed + i * 6) * 40}%)`,
      twinkle: seededRandom(seed + i * 7) * Math.PI * 2,
      twinkleSpeed: seededRandom(seed + i * 8) * 0.05 + 0.02
    }));

    // Generar nebulosas coloridas sincronizadas
    nebula.current = Array.from({ length: 8 }, (_, i) => ({
      x: seededRandom(seed + 1000 + i * 1) * CANVAS_WIDTH,
      y: seededRandom(seed + 1000 + i * 2) * CANVAS_HEIGHT,
      size: seededRandom(seed + 1000 + i * 3) * 300 + 150,
      color: `hsla(${seededRandom(seed + 1000 + i * 4) * 360}, 60%, 25%, 0.15)`,
      speed: seededRandom(seed + 1000 + i * 5) * 0.3 + 0.1,
      rotation: 0,
      rotationSpeed: seededRandom(seed + 1000 + i * 6) * 0.01 + 0.005
    }));

    // Generar cometas sincronizados
    comets.current = Array.from({ length: 3 }, (_, i) => ({
      x: -100,
      y: seededRandom(seed + 2000 + i * 1) * CANVAS_HEIGHT,
      speed: seededRandom(seed + 2000 + i * 2) * 4 + 3,
      size: seededRandom(seed + 2000 + i * 3) * 3 + 1,
      tail: [],
      color: `hsl(${seededRandom(seed + 2000 + i * 4) * 60 + 180}, 90%, 70%)`,
      angle: seededRandom(seed + 2000 + i * 5) * 0.5 + 0.1
    }));

    // Generar planetas de fondo sincronizados
    planets.current = Array.from({ length: 2 }, (_, i) => ({
      x: seededRandom(seed + 3000 + i * 1) * CANVAS_WIDTH,
      y: seededRandom(seed + 3000 + i * 2) * CANVAS_HEIGHT,
      size: seededRandom(seed + 3000 + i * 3) * 80 + 40,
      color: `hsl(${seededRandom(seed + 3000 + i * 4) * 360}, 50%, 40%)`,
      speed: seededRandom(seed + 3000 + i * 5) * 0.2 + 0.05,
      rotation: 0
    }));
  }, [level, gameSeed]);


  const handleKeyDown = useCallback((e) => {
    keysRef.current[e.code] = true;
    e.preventDefault();
  }, [keysRef]);

  const handleKeyUp = useCallback((e) => {
    keysRef.current[e.code] = false;
    e.preventDefault();
  }, [keysRef]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Focus canvas when players are present (game is active)
  useEffect(() => {
    if (players && players.length > 0 && canvasRef.current) {
      canvasRef.current.focus();
    }
  }, [players]);

  const getShipDesign = useCallback((shipType) => {
    const designs = {
      ship1: { shape: 'basic', powerup: 'rapidFire', color: '#0077FF', special: 'Disparo Rápido' },
      ship2: { shape: 'advanced', powerup: 'shield', color: '#00FF77', special: 'Escudo Automático' },
      ship3: { shape: 'elite', powerup: 'tripleShot', color: '#FF7700', special: 'Disparo Triple' },
      ship4: { shape: 'supreme', powerup: 'laser', color: '#FF0077', special: 'Láser Devastador' },
      ship5: { shape: 'stealth', powerup: 'invisibility', color: '#8A2BE2', special: 'Invisibilidad' },
      ship6: { shape: 'bomber', powerup: 'megaBomb', color: '#FF4500', special: 'Bombardero' },
      ship7: { shape: 'healer', powerup: 'healthRegen', color: '#32CD32', special: 'Regeneración' },
      ship8: { shape: 'speedster', powerup: 'speedBoost', color: '#FFD700', special: 'Velocidad Extrema' },
      ship9: { shape: 'phoenix', powerup: 'fireStorm', color: '#FF6347', special: 'Tormenta de Fuego' },
      ship10: { shape: 'frost', powerup: 'iceBlast', color: '#00BFFF', special: 'Explosión Helada' },
      ship11: { shape: 'thunder', powerup: 'lightningChain', color: '#FFFF00', special: 'Cadena Eléctrica' },
      ship12: { shape: 'void', powerup: 'blackHole', color: '#800080', special: 'Agujero Negro' },
      ship13: { shape: 'quantum', powerup: 'teleportStrike', color: '#FF00FF', special: 'Golpe Teleportado' },
      ship14: { shape: 'cosmic', powerup: 'starBarrage', color: '#FFA500', special: 'Barrera Estelar' },
      ship15: { shape: 'nebula', powerup: 'plasmaWave', color: '#9370DB', special: 'Onda de Plasma' },
      ship16: { shape: 'meteor', powerup: 'meteorShower', color: '#DC143C', special: 'Lluvia de Meteoros' },
      admin1: { shape: 'royal', powerup: 'megaBomb', color: '#FFD700', special: 'Mega Bomba' },
      admin2: { shape: 'stellar', powerup: 'invincibility', color: '#FF69B4', special: 'Invencibilidad' },
      heartShip: { shape: 'heart', powerup: 'loveBeam', color: '#FF1493', special: 'Rayo de Amor' }
    };
    return designs[shipType] || { shape: 'basic', powerup: 'rapidFire', color: '#0077FF', special: 'Disparo Rápido' };
  }, []);

  const getEnemyDesign = useCallback((enemyType, level) => {
    const designs = {
      scout: { color: '#FF4444', shape: 'triangle', speed: 1.5, health: 1 },
      fighter: { color: '#44FF44', shape: 'diamond', speed: 1.0, health: 2 },
      cruiser: { color: '#4444FF', shape: 'hexagon', speed: 0.8, health: 3 },
      destroyer: { color: '#FF44FF', shape: 'octagon', speed: 0.6, health: 4 },
      battleship: { color: '#FFFF44', shape: 'star', speed: 0.4, health: 5 },
      mothership: { color: '#FF8844', shape: 'complex', speed: 0.3, health: 8 }
    };
    
    const design = designs[enemyType] || designs.fighter;
    
    // Color dinámico según nivel
    const hue = (level * 25 + parseInt(design.color.slice(1, 3), 16)) % 360;
    const saturation = Math.min(100, 60 + level * 3);
    const lightness = Math.min(75, 45 + level * 2);
    design.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    return design;
  }, []);
  
  // Fondo espacial dinámico y llamativo
  const drawSpaceBackground = useCallback((ctx) => {
    const time = Date.now() * 0.001;
    
    // Fondo espacial súper llamativo
    const gradient = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
    gradient.addColorStop(0, `hsl(${(time * 10) % 360}, 60%, 15%)`);
    gradient.addColorStop(0.3, `hsl(${(time * 8 + 120) % 360}, 70%, 10%)`);
    gradient.addColorStop(0.6, `hsl(${(time * 6 + 240) % 360}, 80%, 8%)`);
    gradient.addColorStop(1, `hsl(${(time * 12 + 300) % 360}, 50%, 5%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Añadir ondas de energía
    for (let i = 0; i < 3; i++) {
      const waveGradient = ctx.createRadialGradient(
        CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 
        Math.sin(time * 0.5 + i) * 200 + 300,
        CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 
        Math.sin(time * 0.5 + i) * 200 + 500
      );
      waveGradient.addColorStop(0, `hsla(${(time * 15 + i * 120) % 360}, 80%, 30%, 0.1)`);
      waveGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = waveGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // Dibujar planetas de fondo
    planets.current.forEach(planet => {
      planet.y += planet.speed;
      planet.rotation += 0.005;
      if (planet.y > CANVAS_HEIGHT + planet.size) {
        planet.y = -planet.size;
        planet.x = Math.random() * CANVAS_WIDTH;
      }
      
      ctx.save();
      ctx.translate(planet.x, planet.y);
      ctx.rotate(planet.rotation);
      
      // Validar que planet.size sea finito antes de crear el gradiente
      if (isFinite(planet.size) && planet.size > 0) {
        const planetGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, planet.size);
        planetGradient.addColorStop(0, planet.color);
        // Convertir HSL a HSLA de forma segura
        const hslaColor = planet.color.includes('hsl(') 
          ? planet.color.replace('hsl(', 'hsla(').replace(')', ', 0.5)')
          : 'rgba(100, 100, 200, 0.5)';
        planetGradient.addColorStop(0.7, hslaColor);
        planetGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = planetGradient;
      } else {
        ctx.fillStyle = planet.color;
      }
      
      ctx.beginPath();
      ctx.arc(0, 0, planet.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    
    // Dibujar nebulosas
    nebula.current.forEach(neb => {
      neb.y += neb.speed;
      neb.rotation += neb.rotationSpeed;
      if (neb.y > CANVAS_HEIGHT + neb.size) {
        neb.y = -neb.size;
        neb.x = Math.random() * CANVAS_WIDTH;
      }
      
      ctx.save();
      ctx.translate(neb.x, neb.y);
      ctx.rotate(neb.rotation);
      const nebulaGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, neb.size);
      nebulaGradient.addColorStop(0, neb.color);
      nebulaGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(-neb.size/2, -neb.size/2, neb.size, neb.size);
      ctx.restore();
    });
    
    // Dibujar cometas
    comets.current.forEach(comet => {
      comet.x += comet.speed * Math.cos(comet.angle);
      comet.y += comet.speed * Math.sin(comet.angle);
      comet.tail.push({ x: comet.x, y: comet.y });
      if (comet.tail.length > 15) comet.tail.shift();
      
      if (comet.x > CANVAS_WIDTH + 100 || comet.y > CANVAS_HEIGHT + 100) {
        comet.x = -100;
        comet.y = Math.random() * CANVAS_HEIGHT;
        comet.tail = [];
      }
      
      // Cola del cometa
      ctx.strokeStyle = comet.color;
      ctx.lineWidth = comet.size;
      ctx.beginPath();
      comet.tail.forEach((point, i) => {
        ctx.globalAlpha = (i / comet.tail.length) * 0.6;
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
      
      // Cabeza del cometa
      ctx.fillStyle = comet.color;
      ctx.shadowColor = comet.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    
    // Estrellas con parpadeo
    starfield.current.forEach(star => {
      star.y += star.speed;
      star.twinkle += star.twinkleSpeed;
      if (star.y > CANVAS_HEIGHT) {
        star.y = -star.size;
        star.x = Math.random() * CANVAS_WIDTH;
        star.color = `hsl(${Math.random() * 360}, 80%, ${60 + Math.random() * 40}%)`;
      }
      
      const twinkleIntensity = Math.sin(star.twinkle) * 0.4 + 0.6;
      ctx.fillStyle = star.color;
      ctx.shadowColor = star.color;
      ctx.shadowBlur = star.size * 2 * twinkleIntensity;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * twinkleIntensity, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, []);

  const drawShipShape = useCallback((ctx, player) => {
    const { x, y, ship, color } = player;
    const w = PLAYER_WIDTH, h = PLAYER_HEIGHT;
    const design = getShipDesign(ship);
    
    const now = Date.now();
    const shipGlow = Math.sin(now * 0.004) * 0.3 + 0.7;

    ctx.fillStyle = color || design.color;
    ctx.shadowColor = color || design.color;
    ctx.shadowBlur = 10 * shipGlow;
    
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    
    if (ship.startsWith('admin')) {
      ctx.rotate(Math.sin(now * 0.003) * 0.08);
    }
    
    ctx.translate(-w/2, -h/2);
    
    switch (design.shape) {
      case 'basic':
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        break;
      case 'advanced':
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w * 0.9, h * 0.4);
        ctx.lineTo(w * 0.7, h);
        ctx.lineTo(w * 0.3, h);
        ctx.lineTo(w * 0.1, h * 0.4);
        ctx.closePath();
        break;
      case 'elite':
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w / 2, h / 3, 0, 0, Math.PI * 2);
        break;
      case 'supreme':
        ctx.fillRect(w * 0.1, h * 0.2, w * 0.8, h * 0.6);
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w * 0.8, h * 0.2);
        ctx.lineTo(w * 0.2, h * 0.2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'royal':
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w, h * 0.7);
        ctx.lineTo(w * 0.7, h);
        ctx.lineTo(w * 0.3, h);
        ctx.lineTo(0, h * 0.7);
        ctx.closePath();
        break;
      case 'stellar':
        const stellarSpikes = 6, stellarR1 = w / 2, stellarR2 = stellarR1 / 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -stellarR1);
        for (let i = 0; i < 2 * stellarSpikes; i++) {
          const r = (i % 2 === 0) ? stellarR1 : stellarR2;
          const a = Math.PI * i / stellarSpikes - Math.PI / 2;
          ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        ctx.closePath();
        break;
      case 'stealth':
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w*0.8, h*0.3);
        ctx.lineTo(w*0.9, h);
        ctx.lineTo(w*0.1, h);
        ctx.lineTo(w*0.2, h*0.3);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'bomber':
        ctx.fillRect(w*0.2, h*0.1, w*0.6, h*0.8);
        ctx.beginPath();
        ctx.arc(w*0.3, h*0.2, w*0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w*0.7, h*0.2, w*0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'healer':
        ctx.beginPath();
        ctx.arc(w/2, h/2, w/2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(w*0.45, h*0.2, w*0.1, h*0.6);
        ctx.fillRect(w*0.2, h*0.45, w*0.6, h*0.1);
        break;
      case 'speedster':
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w*0.9, h*0.6);
        ctx.lineTo(w*0.6, h);
        ctx.lineTo(w*0.4, h);
        ctx.lineTo(w*0.1, h*0.6);
        ctx.closePath();
        // Estelas de velocidad
        ctx.fill();
        ctx.fillStyle = `${color}80`;
        for(let i = 1; i <= 3; i++) {
          ctx.fillRect(w*0.3, h + i*5, w*0.4, 2);
        }
        break;
      case 'phoenix':
        // Phoenix - Bird-like shape with wings and tail
        ctx.beginPath();
        ctx.moveTo(w/2, 0); // Head
        ctx.lineTo(w*0.7, h*0.2); // Neck to wing
        ctx.lineTo(w*0.9, h*0.4); // Wing tip
        ctx.lineTo(w*0.8, h*0.6); // Wing base
        ctx.lineTo(w*0.6, h*0.8); // Body
        ctx.lineTo(w*0.4, h*0.8); // Body
        ctx.lineTo(w*0.2, h*0.6); // Wing base
        ctx.lineTo(w*0.1, h*0.4); // Wing tip
        ctx.lineTo(w*0.3, h*0.2); // Neck to wing
        ctx.closePath();
        ctx.fill();

        // Phoenix tail feathers
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(w*0.5, h*0.8);
        ctx.lineTo(w*0.3, h);
        ctx.lineTo(w*0.4, h*0.9);
        ctx.lineTo(w*0.5, h);
        ctx.lineTo(w*0.6, h*0.9);
        ctx.lineTo(w*0.7, h);
        ctx.closePath();
        ctx.fill();

        // Phoenix wing details
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(w*0.7, h*0.3);
        ctx.lineTo(w*0.8, h*0.2);
        ctx.lineTo(w*0.9, h*0.3);
        ctx.lineTo(w*0.8, h*0.4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w*0.3, h*0.3);
        ctx.lineTo(w*0.2, h*0.2);
        ctx.lineTo(w*0.1, h*0.3);
        ctx.lineTo(w*0.2, h*0.4);
        ctx.closePath();
        ctx.fill();
        break;
      case 'frost':
        // Frost - Ice crystal formation
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w*0.6, h*0.2);
        ctx.lineTo(w*0.8, h*0.4);
        ctx.lineTo(w*0.6, h*0.6);
        ctx.lineTo(w*0.8, h*0.8);
        ctx.lineTo(w*0.6, h);
        ctx.lineTo(w*0.4, h);
        ctx.lineTo(w*0.2, h*0.8);
        ctx.lineTo(w*0.4, h*0.6);
        ctx.lineTo(w*0.2, h*0.4);
        ctx.lineTo(w*0.4, h*0.2);
        ctx.closePath();
        ctx.fill();

        // Ice spikes
        ctx.fillStyle = '#E0FFFF';
        ctx.beginPath();
        ctx.moveTo(w*0.5, h*0.1);
        ctx.lineTo(w*0.45, h*0.3);
        ctx.lineTo(w*0.55, h*0.3);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w*0.3, h*0.4);
        ctx.lineTo(w*0.25, h*0.6);
        ctx.lineTo(w*0.35, h*0.6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w*0.7, h*0.4);
        ctx.lineTo(w*0.65, h*0.6);
        ctx.lineTo(w*0.75, h*0.6);
        ctx.closePath();
        ctx.fill();
        break;
      case 'thunder':
        // Thunder - Lightning bolt shape
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w*0.6, h*0.2);
        ctx.lineTo(w*0.4, h*0.4);
        ctx.lineTo(w*0.7, h*0.6);
        ctx.lineTo(w*0.3, h*0.8);
        ctx.lineTo(w*0.5, h);
        ctx.lineTo(w*0.4, h*0.9);
        ctx.lineTo(w*0.6, h*0.7);
        ctx.lineTo(w*0.5, h*0.5);
        ctx.lineTo(w*0.7, h*0.3);
        ctx.closePath();
        ctx.fill();

        // Lightning effects
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo(w*0.45, h*0.2);
        ctx.lineTo(w*0.5, h*0.1);
        ctx.lineTo(w*0.55, h*0.2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w*0.35, h*0.6);
        ctx.lineTo(w*0.4, h*0.5);
        ctx.lineTo(w*0.45, h*0.6);
        ctx.closePath();
        ctx.fill();
        break;
      case 'void':
        // Void - Black hole with event horizon
        ctx.beginPath();
        ctx.arc(w/2, h/2, w/2, 0, Math.PI * 2);
        ctx.fill();

        // Event horizon
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(w/2, h/2, w*0.4, 0, Math.PI * 2);
        ctx.fill();

        // Accretion disk
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.ellipse(w/2, h/2, w*0.35, w*0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner singularity
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(w/2, h/2, w*0.1, 0, Math.PI * 2);
        ctx.fill();

        // Gravitational lensing effect
        ctx.strokeStyle = '#800080';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w/2, h/2, w*0.45, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'quantum':
        // Quantum - Probability wave with particles
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.quadraticCurveTo(w*0.8, h*0.3, w, h*0.5);
        ctx.quadraticCurveTo(w*0.8, h*0.7, w/2, h);
        ctx.quadraticCurveTo(w*0.2, h*0.7, 0, h*0.5);
        ctx.quadraticCurveTo(w*0.2, h*0.3, w/2, 0);
        ctx.closePath();
        ctx.fill();

        // Quantum particles
        ctx.fillStyle = '#FF00FF';
        for(let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const distance = w * (0.15 + Math.sin(Date.now() * 0.01 + i) * 0.1);
          const px = w/2 + Math.cos(angle) * distance;
          const py = h/2 + Math.sin(angle) * distance;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Quantum entanglement lines
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w*0.3, h*0.3);
        ctx.lineTo(w*0.7, h*0.7);
        ctx.moveTo(w*0.7, h*0.3);
        ctx.lineTo(w*0.3, h*0.7);
        ctx.stroke();
        break;
      case 'cosmic':
        // Cosmic - Galaxy spiral with stars
        ctx.beginPath();
        ctx.arc(w/2, h/2, w/2, 0, Math.PI * 2);
        ctx.fill();

        // Galaxy arms
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.moveTo(w/2, h/2);
        for(let i = 0; i <= 360; i += 10) {
          const angle = i * Math.PI / 180;
          const radius = w * 0.4 * (1 + Math.sin(angle * 2) * 0.3);
          const x = w/2 + Math.cos(angle) * radius;
          const y = h/2 + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Central black hole
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(w/2, h/2, w*0.15, 0, Math.PI * 2);
        ctx.fill();

        // Stars
        ctx.fillStyle = '#FFFFFF';
        for(let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const radius = w * 0.35;
          const x = w/2 + Math.cos(angle) * radius;
          const y = h/2 + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'nebula':
        // Nebula - Gas cloud formation
        ctx.beginPath();
        ctx.ellipse(w/2, h/2, w/2, h/3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gas clouds with different colors
        ctx.fillStyle = '#9370DB';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(w*0.25, h*0.35, w*0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(w*0.6, h*0.5, w*0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00BFFF';
        ctx.beginPath();
        ctx.arc(w*0.45, h*0.65, w*0.18, 0, Math.PI * 2);
        ctx.fill();

        // Star formation in nebula
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 1;
        for(let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const radius = w * 0.3;
          const x = w/2 + Math.cos(angle) * radius;
          const y = h/2 + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'meteor':
        // Meteor - Rock with fiery trail
        ctx.beginPath();
        ctx.moveTo(w*0.15, h*0.1);
        ctx.lineTo(w*0.85, h*0.25);
        ctx.lineTo(w*0.9, h*0.6);
        ctx.lineTo(w*0.75, h*0.9);
        ctx.lineTo(w*0.5, h);
        ctx.lineTo(w*0.25, h*0.9);
        ctx.lineTo(w*0.1, h*0.6);
        ctx.lineTo(w*0.05, h*0.25);
        ctx.closePath();
        ctx.fill();

        // Craters on meteor surface
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(w*0.3, h*0.4, w*0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w*0.6, h*0.6, w*0.06, 0, Math.PI * 2);
        ctx.fill();

        // Fiery trail
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(w*0.05, h*0.15);
        ctx.lineTo(w*0.02, h*0.4);
        ctx.lineTo(w*0.08, h*0.8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(w*0.08, h*0.2);
        ctx.lineTo(w*0.04, h*0.5);
        ctx.lineTo(w*0.12, h*0.7);
        ctx.closePath();
        ctx.fill();

        // Glowing particles
        ctx.fillStyle = '#FFFF00';
        for(let i = 0; i < 5; i++) {
          const x = w*0.02 + (i * w*0.04);
          const y = h*0.3 + (i * h*0.1);
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'heart':
        ctx.beginPath();
        ctx.moveTo(w/2, h * 0.3);
        ctx.bezierCurveTo(w/2, h * 0.1, w * 0.1, h * 0.1, w * 0.1, h * 0.4);
        ctx.bezierCurveTo(w * 0.1, h * 0.6, w/2, h * 0.8, w/2, h);
        ctx.bezierCurveTo(w/2, h * 0.8, w * 0.9, h * 0.6, w * 0.9, h * 0.4);
        ctx.bezierCurveTo(w * 0.9, h * 0.1, w/2, h * 0.1, w/2, h * 0.3);
        ctx.closePath();
        break;
      default:
        ctx.fillRect(0, 0, w, h);
    }
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
    
    // Indicador de power-up especial
    if (design.special) {
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('★', x + w/2, y - 8);
      ctx.shadowBlur = 0;
    }
  }, [getShipDesign]);

  const drawPlayer = useCallback((ctx, player) => {
    const isSpectator = player.lives <= 0;

    // Debug ship data
    if (!player.ship) {
      console.warn('Jugador sin datos de nave:', player);
      player.ship = 'ship1'; // Fallback
    } else {
      console.log(`Dibujando jugador ${player.name} con nave: ${player.ship}`);
    }

    // Validar coordenadas del jugador
    if (!isFinite(player.x) || !isFinite(player.y)) {
      console.warn('Coordenadas de jugador inválidas:', player);
      return;
    }

    ctx.save();

    // Para espectadores, reducir opacidad
    if (isSpectator) {
      ctx.globalAlpha = 0.4;
    }

    // Rainbow mode para admin especial
    if (player.isAdmin && player.settings?.rainbowMode) {
      const time = Date.now() * 0.006;
      const hue = (time * 60) % 360;
      player.color = `hsl(${hue}, 100%, 65%)`;
    }

    // Efectos de propulsión mejorados (solo para jugadores activos)
    if (!isSpectator) {
      const thrusterIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
      if (isFinite(thrusterIntensity) && isFinite(player.x) && isFinite(player.y)) {
        const thrusterGradient = ctx.createLinearGradient(
          player.x, player.y + PLAYER_HEIGHT,
          player.x, player.y + PLAYER_HEIGHT + 20
        );
        thrusterGradient.addColorStop(0, `rgba(0, 150, 255, ${thrusterIntensity})`);
        thrusterGradient.addColorStop(0.5, `rgba(255, 120, 0, ${thrusterIntensity * 0.8})`);
        thrusterGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = thrusterGradient;
        ctx.beginPath();
        ctx.moveTo(player.x + PLAYER_WIDTH * 0.35, player.y + PLAYER_HEIGHT);
        ctx.lineTo(player.x + PLAYER_WIDTH * 0.65, player.y + PLAYER_HEIGHT);
        ctx.lineTo(player.x + PLAYER_WIDTH * 0.5, player.y + PLAYER_HEIGHT + 15 * thrusterIntensity);
        ctx.closePath();
        ctx.fill();
      }
    }

    drawShipShape(ctx, player);
    
    const now = Date.now();

    // Escudo con efectos mejorados
    if (player.activePowerups?.shield > now) {
      const shieldPulse = Math.sin(now * 0.01) * 0.2 + 0.8;
      const shieldColor = `hsl(${(now * 0.2) % 360}, 100%, 70%)`;
      
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = shieldColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, PLAYER_WIDTH / 1.5 * shieldPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Indicador de disparo rápido
    if (player.activePowerups?.rapidFire > now) {
      const rapidFirePulse = Math.sin(now * 0.02) * 0.4 + 0.6;
      const rapidFireColor = `hsl(${(now * 0.3) % 360}, 100%, ${50 + rapidFirePulse * 30}%)`;
      
      ctx.fillStyle = rapidFireColor;
      ctx.shadowColor = rapidFireColor;
      ctx.shadowBlur = 12;
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(player.x + PLAYER_WIDTH/2 + (i-1)*6, player.y - i*4);
        ctx.lineTo(player.x + PLAYER_WIDTH/2 - 4 + (i-1)*6, player.y - 8 - i*4);
        ctx.lineTo(player.x + PLAYER_WIDTH/2 + 4 + (i-1)*6, player.y - 8 - i*4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    
    // Nombre del jugador
    if (player.name) {
      const nameGlow = Math.sin(now * 0.01) * 0.3 + 0.7;
      let nameColor = player.isLocal ? `hsl(${(now * 0.15) % 360}, 100%, 70%)` : '#FFFFFF';
      
      if (player.isAdmin && player.settings?.rainbowMode) {
        const hue = (now * 0.12) % 360;
        nameColor = `hsl(${hue}, 100%, 70%)`;
      }
      
      ctx.fillStyle = nameColor;
      ctx.shadowColor = nameColor;
      ctx.shadowBlur = 10 * nameGlow;
      ctx.font = 'bold 13px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, player.x + PLAYER_WIDTH / 2, player.y - 8);
      ctx.shadowBlur = 0;
    }
    
    // Indicador de red/local
    const connectionType = player.isMultiplayer ? 'NET' : 'LOCAL';
    const connectionColor = player.isMultiplayer ? '#00FF00' : '#FFFF00';

    ctx.fillStyle = connectionColor;
    ctx.shadowColor = connectionColor;
    ctx.shadowBlur = 6;
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(connectionType, player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT + 15);
    ctx.shadowBlur = 0;

    // Indicador de espectador
    if (isSpectator) {
      ctx.fillStyle = '#FF4444';
      ctx.shadowColor = '#FF4444';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SPECTATOR', player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT + 35);
      ctx.shadowBlur = 0;
    }
    
    // Mascotas mejoradas con formas impresionantes (mostrar para todos los jugadores en multiplayer)
    if (player.equippedPet && (player.isLocal || player.isMultiplayer)) {
      const petX = player.x + PLAYER_WIDTH + 25;
      const petY = player.y + PLAYER_HEIGHT / 2;
      const petPulse = Math.sin(now * 0.01) * 0.2 + 0.8;
      const petRotation = now * 0.002;

      const petColors = {
        autoShooterPet: '#00FF00',
        magnetPet: '#00BFFF',
        healerPet: '#FF69B4',
        shieldPet: '#FFD700',
        speedPet: '#FF4500',
        bombPet: '#8A2BE2'
      };
      const petColor = petColors[player.equippedPet] || '#FFFFFF';

      ctx.save();
      ctx.translate(petX, petY);
      ctx.rotate(petRotation);
      ctx.scale(petPulse, petPulse);

      // Formas temáticas para cada mascota
      switch(player.equippedPet) {
        case 'autoShooterPet':
          // Robot de disparo automático - forma de cañón
          ctx.fillStyle = petColor;
          ctx.shadowColor = petColor;
          ctx.shadowBlur = 8 * petPulse;

          // Base del cañón
          ctx.fillRect(-8, -3, 16, 6);

          // Cañón principal
          ctx.fillRect(8, -1, 12, 2);

          // Brazos mecánicos
          ctx.fillRect(-6, -8, 2, 5);
          ctx.fillRect(4, -8, 2, 5);

          // Ojos LED
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-3, -1, 1.5, 0, Math.PI * 2);
          ctx.arc(3, -1, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Núcleo de energía
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'magnetPet':
          // Imán poderoso - forma de herradura magnética
          ctx.fillStyle = petColor;
          ctx.shadowColor = petColor;
          ctx.shadowBlur = 10 * petPulse;

          // Herradura magnética
          ctx.beginPath();
          ctx.arc(0, -5, 8, Math.PI * 0.2, Math.PI * 0.8);
          ctx.lineTo(6, 3);
          ctx.arc(3, 3, 3, 0, Math.PI);
          ctx.lineTo(-6, 3);
          ctx.closePath();
          ctx.fill();

          // Polos magnéticos
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(-4, -2, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0000FF';
          ctx.beginPath();
          ctx.arc(4, -2, 2, 0, Math.PI * 2);
          ctx.fill();

          // Líneas de campo magnético
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-4, -2);
          ctx.lineTo(-8, -6);
          ctx.moveTo(4, -2);
          ctx.lineTo(8, -6);
          ctx.stroke();
          break;

        case 'healerPet':
          // Ángel sanador - forma de cruz con alas
          ctx.fillStyle = petColor;
          ctx.shadowColor = petColor;
          ctx.shadowBlur = 12 * petPulse;

          // Cruz médica
          ctx.fillRect(-1, -8, 2, 16);
          ctx.fillRect(-6, -1, 12, 2);

          // Alas angélicas
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.moveTo(-8, -4);
          ctx.quadraticCurveTo(-12, -8, -6, -12);
          ctx.quadraticCurveTo(0, -10, 6, -12);
          ctx.quadraticCurveTo(12, -8, 8, -4);
          ctx.closePath();
          ctx.fill();

          // Aura sanadora
          ctx.strokeStyle = '#FF69B4';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.stroke();

          // Corazón pulsante
          const heartPulse = Math.sin(now * 0.02) * 0.3 + 0.7;
          ctx.fillStyle = '#FF1493';
          ctx.beginPath();
          ctx.arc(-2, -1, 1.5 * heartPulse, 0, Math.PI * 2);
          ctx.arc(2, -1, 1.5 * heartPulse, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'shieldPet':
          // Guardián escudo - forma de escudo vikingo
          ctx.fillStyle = petColor;
          ctx.shadowColor = petColor;
          ctx.shadowBlur = 10 * petPulse;

          // Escudo vikingo
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(6, -4);
          ctx.lineTo(6, 6);
          ctx.lineTo(-6, 6);
          ctx.lineTo(-6, -4);
          ctx.closePath();
          ctx.fill();

          // Detalles del escudo
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(-4, -2, 8, 1);
          ctx.fillRect(-4, 0, 8, 1);
          ctx.fillRect(-4, 2, 8, 1);

          // Aura protectora
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.stroke();

          // Partículas de protección
          for(let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = Math.cos(angle) * 12;
            const py = Math.sin(angle) * 12;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        case 'speedPet':
          // Relámpago veloz - forma de rayo
          ctx.fillStyle = petColor;
          ctx.shadowColor = petColor;
          ctx.shadowBlur = 15 * petPulse;

          // Rayo principal
          ctx.beginPath();
          ctx.moveTo(-2, -8);
          ctx.lineTo(0, -4);
          ctx.lineTo(-2, 0);
          ctx.lineTo(6, 8);
          ctx.lineTo(4, 4);
          ctx.lineTo(2, 8);
          ctx.closePath();
          ctx.fill();

          // Efectos de velocidad (estelas)
          ctx.fillStyle = `${petColor}80`;
          for(let i = 1; i <= 4; i++) {
            ctx.fillRect(-2 - i*2, -8 + i*2, 8, 1);
          }

          // Partículas de velocidad
          for(let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 15;
            const px = Math.cos(angle) * distance;
            const py = Math.sin(angle) * distance;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(px, py, 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        case 'bombPet':
          // Demoledor explosivo - forma de bomba
          ctx.fillStyle = petColor;
          ctx.shadowColor = petColor;
          ctx.shadowBlur = 12 * petPulse;

          // Cuerpo de la bomba
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();

          // Mecha
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(0, -10);
          ctx.stroke();

          // Chispa en la mecha
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(0, -10, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Anillos explosivos
          ctx.strokeStyle = '#FF4500';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.stroke();

          // Partículas explosivas
          for(let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const px = Math.cos(angle) * 12;
            const py = Math.sin(angle) * 12;
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        default:
          // Mascota básica (círculo)
          ctx.fillStyle = petColor;
          ctx.shadowColor = petColor;
          ctx.shadowBlur = 6 * petPulse;
          ctx.beginPath();
          ctx.arc(0, 0, 6 * petPulse, 0, Math.PI * 2);
          ctx.fill();
      }

      ctx.restore();
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
  }, [drawShipShape]);

  const drawEnemyShape = useCallback((ctx, enemy, design, level) => {
    const {x, y, width, height, animationFrame = 0} = enemy;

    // Validar coordenadas del enemigo
    if (!isFinite(x) || !isFinite(y)) {
      console.warn('Coordenadas de enemigo inválidas:', enemy);
      return;
    }

    ctx.fillStyle = design.color;
    ctx.shadowColor = design.color;
    ctx.shadowBlur = 6;

    // Animaciones mejoradas por nivel con más variedad
    const levelAnim = level % 12;
    let scaleX = 1, scaleY = 1, rotation = 0, glowIntensity = 1;
    const time = Date.now() * 0.001;

    switch(levelAnim) {
      case 0: // Pulsación suave con glow
        const pulse = Math.sin(animationFrame * 0.15) * 0.12 + 1;
        scaleX = scaleY = pulse;
        glowIntensity = pulse;
        break;
      case 1: // Rotación suave con brillo pulsante
        rotation = animationFrame * 0.025;
        glowIntensity = Math.sin(animationFrame * 0.1) * 0.3 + 0.7;
        break;
      case 2: // Oscilación horizontal con deformación
        scaleX = Math.sin(animationFrame * 0.12) * 0.18 + 1;
        scaleY = Math.cos(animationFrame * 0.08) * 0.08 + 1;
        break;
      case 3: // Brillo intenso con color shifting
        glowIntensity = Math.sin(animationFrame * 0.12) * 0.6 + 0.7;
        const hueShift = (animationFrame * 3) % 60 - 30;
        ctx.fillStyle = `hsl(${parseInt(design.color.slice(4, -1).split(',')[0]) + hueShift}, 80%, 60%)`;
        ctx.shadowColor = ctx.fillStyle;
        break;
      case 4: // Cambio de color dinámico
        const dynamicHue = (animationFrame * 2.5 + level * 30) % 360;
        ctx.fillStyle = `hsl(${dynamicHue}, 75%, 55%)`;
        ctx.shadowColor = ctx.fillStyle;
        break;
      case 5: // Respiración con glow pulsante
        const breathe = Math.sin(animationFrame * 0.1) * 0.1 + 1;
        scaleX = breathe;
        scaleY = 1 / breathe;
        glowIntensity = breathe;
        break;
      case 6: // Vibración con rotación
        const vibrate = Math.sin(animationFrame * 0.4) * 1.5;
        ctx.translate(vibrate, 0);
        rotation = Math.sin(animationFrame * 0.08) * 0.1;
        break;
      case 7: // Ondulación con escala
        const wave = Math.sin(animationFrame * 0.18) * 0.12 + 1;
        scaleY = wave;
        scaleX = 2 - wave;
        break;
      case 8: // Movimiento orbital
        const orbitX = Math.cos(animationFrame * 0.2) * 3;
        const orbitY = Math.sin(animationFrame * 0.2) * 2;
        ctx.translate(orbitX, orbitY);
        break;
      case 9: // Pulso de energía
        const energyPulse = Math.sin(animationFrame * 0.25) * 0.15 + 1;
        scaleX = scaleY = energyPulse;
        glowIntensity = energyPulse * 1.5;
        break;
      case 10: // Twist con glow
        rotation = Math.sin(animationFrame * 0.15) * 0.3;
        glowIntensity = Math.abs(Math.sin(animationFrame * 0.1)) * 0.8 + 0.5;
        break;
      case 11: // Morphing shape
        const morph = Math.sin(animationFrame * 0.08) * 0.2 + 1;
        scaleX = morph;
        scaleY = 2 - morph;
        rotation = animationFrame * 0.01;
        break;
    }

    // Aplicar glow intensity
    ctx.shadowBlur = 8 * glowIntensity;

    ctx.save();
    ctx.translate(x + width/2, y + height/2);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-width/2, -height/2);

    // Dibujar caja de colisión mejorada para debug
    if (enemy.showCollisionBox) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(0, 0, width, height);
      ctx.setLineDash([]);
    }

    // Dibujar forma del enemigo con mejoras
    switch(design.shape) {
      case 'triangle': // Scout
        ctx.beginPath();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width * 0.9, height);
        ctx.lineTo(width * 0.1, height);
        ctx.closePath();
        // Añadir detalles
        ctx.moveTo(width/2, height * 0.3);
        ctx.lineTo(width * 0.6, height * 0.7);
        ctx.moveTo(width/2, height * 0.3);
        ctx.lineTo(width * 0.4, height * 0.7);
        break;
      case 'diamond': // Fighter
        ctx.beginPath();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width, height/2);
        ctx.lineTo(width/2, height);
        ctx.lineTo(0, height/2);
        ctx.closePath();
        // Añadir líneas diagonales
        ctx.moveTo(width * 0.25, height * 0.25);
        ctx.lineTo(width * 0.75, height * 0.75);
        ctx.moveTo(width * 0.75, height * 0.25);
        ctx.lineTo(width * 0.25, height * 0.75);
        break;
      case 'hexagon': // Cruiser
        const sides = 6;
        const radius = width/2;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI / sides) * (2 * i) - Math.PI / 6;
          const px = width/2 + radius * Math.cos(angle);
          const py = height/2 + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        // Añadir círculos internos
        ctx.moveTo(width/2, height/2);
        ctx.arc(width/2, height/2, radius * 0.3, 0, Math.PI * 2);
        break;
      case 'octagon': // Destroyer
        const octSides = 8;
        const octRadius = width/2;
        ctx.beginPath();
        for (let i = 0; i < octSides; i++) {
          const angle = (Math.PI / octSides) * (2 * i);
          const px = width/2 + octRadius * Math.cos(angle);
          const py = height/2 + octRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        // Añadir patrón de rejilla
        for (let i = 0; i < 3; i++) {
          ctx.moveTo(width * 0.2 + i * width * 0.2, height * 0.2);
          ctx.lineTo(width * 0.2 + i * width * 0.2, height * 0.8);
          ctx.moveTo(width * 0.2, height * 0.2 + i * height * 0.2);
          ctx.lineTo(width * 0.8, height * 0.2 + i * height * 0.2);
        }
        break;
      case 'star': // Battleship
        const spikes = 5;
        const outerRadius = width/2;
        const innerRadius = width/4;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          const px = width/2 + radius * Math.cos(angle);
          const py = height/2 + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case 'complex': // Mothership
        ctx.beginPath();
        ctx.ellipse(width/2, height/2, width/2, height/4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(width/2, height/3, width/3, height/6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Detalles mejorados
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for(let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.arc(width/8 + i * width/8, height/2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        // Añadir antenas
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        for(let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(width/2 + (i-1) * width/4, height/4);
          ctx.lineTo(width/2 + (i-1) * width/4, height/6);
          ctx.stroke();
        }
        break;
      case 'heart': // Special heart shape for admin
        ctx.beginPath();
        const heartScale = width / 60;
        ctx.moveTo(width/2, height * 0.3);
        ctx.bezierCurveTo(width/2, height * 0.1, width * 0.1, height * 0.1, width * 0.1, height * 0.4);
        ctx.bezierCurveTo(width * 0.1, height * 0.6, width/2, height * 0.8, width/2, height);
        ctx.bezierCurveTo(width/2, height * 0.8, width * 0.9, height * 0.6, width * 0.9, height * 0.4);
        ctx.bezierCurveTo(width * 0.9, height * 0.1, width/2, height * 0.1, width/2, height * 0.3);
        ctx.closePath();
        break;
      default:
        ctx.fillRect(0, 0, width, height);
    }
    ctx.fill();
    ctx.restore();

    // Barra de vida mejorada para enemigos resistentes
    if (enemy.health > 1 && enemy.maxHealth > 1) {
      const barWidth = width * 0.9;
      const barHeight = 6;
      const healthPercent = enemy.health / enemy.maxHealth;

      // Fondo de la barra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x + (width - barWidth)/2 - 1, y - 10, barWidth + 2, barHeight + 2);

      // Barra de daño
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillRect(x + (width - barWidth)/2, y - 9, barWidth, barHeight);

      // Barra de vida con gradiente mejorado
      const healthGradient = ctx.createLinearGradient(
        x + (width - barWidth)/2, y - 9,
        x + (width - barWidth)/2 + barWidth, y - 9
      );
      healthGradient.addColorStop(0, '#00FF00');
      healthGradient.addColorStop(0.3, '#80FF00');
      healthGradient.addColorStop(0.6, '#FFFF00');
      healthGradient.addColorStop(0.8, '#FF8000');
      healthGradient.addColorStop(1, '#FF0000');
      ctx.fillStyle = healthGradient;
      ctx.fillRect(x + (width - barWidth)/2, y - 9, barWidth * healthPercent, barHeight);

      // Borde brillante
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + (width - barWidth)/2, y - 9, barWidth, barHeight);
    }

    // Reset shadow
    ctx.shadowBlur = 0;
  }, []);
  
  const drawEnemy = useCallback((ctx, enemy, level) => {
    ctx.save();
    const design = getEnemyDesign(enemy.type, level);
    drawEnemyShape(ctx, enemy, design, level);
    ctx.restore();
  }, [getEnemyDesign, drawEnemyShape]);
  
  const drawBullet = useCallback((ctx, bullet) => {
    const bulletPulse = Math.sin(Date.now() * 0.02) * 0.2 + 0.8;
    let bulletColor = bullet.isEnemy ? '#FF4444' : '#00FFFF';
    
    if (bullet.isLaser) {
      bulletColor = '#FF0000';
      ctx.fillStyle = `${bulletColor}80`;
      ctx.shadowColor = bulletColor;
      ctx.shadowBlur = 20;
      ctx.fillRect(bullet.x, 0, bullet.width, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillRect(bullet.x + 2, 0, bullet.width - 4, CANVAS_HEIGHT);
      ctx.shadowBlur = 0;
      return;
    }
    
    if (bullet.isPetBomb) {
      bulletColor = '#8A2BE2';
    }
    
    // Estela de la bala
    ctx.fillStyle = `${bulletColor}40`;
    ctx.shadowColor = bulletColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(bullet.x - 1, bullet.y + bullet.height * 0.5, bullet.width + 2, bullet.height * 2);
    
    // Bala principal
    ctx.fillStyle = bulletColor;
    ctx.shadowColor = bulletColor;
    ctx.shadowBlur = 10 * bulletPulse;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    
    // Núcleo brillante
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 6;
    ctx.fillRect(bullet.x + 1, bullet.y + 1, bullet.width - 2, bullet.height - 2);
    ctx.shadowBlur = 0;
  }, []);
  
  const drawPowerup = useCallback((ctx, powerup) => {
    const colors = { 
      rapidFire: '#FFFF00', shield: '#00FFFF', ultimateBomb: '#FF00FF',
      laser: '#FF0000', doubleCoins: '#FFD700', healthRegen: '#FF6347',
      bulletPierce: '#8A2BE2', autoShooterPet: '#00FF00', magnetPet: '#00BFFF',
      tripleShot: '#FF6347', speedBoost: '#32CD32', megaBomb: '#FF1493',
      timeFreeze: '#87CEEB', invincibility: '#FFD700', galacticBomb: '#FF00FF'
    };
    
    const color = colors[powerup.type] || '#FFF';
    const pulse = Math.sin(Date.now() * 0.012) * 0.25 + 0.75;
    
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12 * pulse;
    
    const w = powerup.width, h = powerup.height, x = powerup.x, y = powerup.y;
    const cx = x + w / 2, cy = y + h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Date.now() * 0.003);
    ctx.scale(pulse, pulse);
    ctx.translate(-w/2, -h/2);

    ctx.beginPath();
    switch (powerup.type) {
      case 'rapidFire':
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w*0.75, h/2);
        ctx.lineTo(w/2, h*0.75);
        ctx.lineTo(w*0.25, h/2);
        ctx.closePath();
        break;
      case 'shield':
        const sides = 6;
        const radius = w / 2;
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI / sides) * (2 * i) + Math.PI / 6;
          const px = w/2 + radius * Math.cos(angle);
          const py = h/2 + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      default:
        ctx.arc(w/2, h/2, w/2, 0, Math.PI * 2);
        break;
    }
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }, []);

  const drawCoin = useCallback((ctx, coin) => { 
    const pulse = Math.sin(Date.now() * 0.012) * 0.15 + 0.85;
    const rotation = Date.now() * 0.004;
    
    ctx.save();
    ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2);
    ctx.rotate(rotation);
    ctx.scale(pulse, pulse);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.width/2);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.7, '#FFA500');
    gradient.addColorStop(1, '#FF8C00');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);
    
    ctx.restore();
  }, []);
  
  // Explosiones animadas reales que se quitan
  const drawExplosion = useCallback((ctx, explosion) => {
    const progress = Math.min(1, explosion.time / explosion.duration);
    const maxSize = explosion.size;
    const currentSize = maxSize * (0.2 + progress * 1.5);
    const alpha = Math.max(0, 1 - Math.pow(progress, 1.2));
    
    if (alpha <= 0.05) return; // No dibujar si es casi invisible
    
    ctx.save();
    ctx.translate(explosion.x, explosion.y);
    ctx.globalAlpha = alpha;
    
    // Múltiples anillos de explosión
    const colors = ['#FFFFFF', '#FFFF00', '#FF8000', '#FF0000', '#800080'];
    const ringCount = Math.min(5, Math.floor(progress * 6) + 1);
    
    for (let i = 0; i < ringCount; i++) {
      const ringProgress = Math.max(0, (progress * ringCount - i) / ringCount);
      const ringSize = currentSize * (0.3 + ringProgress * 0.7);
      const ringAlpha = alpha * (1 - i * 0.2) * (1 - ringProgress * 0.3);
      
      if (ringAlpha > 0.1) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, ringSize);
        const color = colors[i % colors.length];
        gradient.addColorStop(0, color + Math.floor(ringAlpha * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, color + Math.floor(ringAlpha * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Partículas de la explosión
    const particleCount = Math.floor(maxSize / 10);
    const particleProgress = Math.min(1, progress * 1.3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + progress * 0.3;
      const distance = currentSize * 0.6 * particleProgress;
      const sparkX = Math.cos(angle) * distance;
      const sparkY = Math.sin(angle) * distance;
      const sparkSize = Math.max(1, 3 * (1 - particleProgress));
      
      const sparkAlpha = alpha * (1 - particleProgress);
      if (sparkAlpha > 0.15) {
        ctx.fillStyle = `rgba(255, 255, 150, ${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }, []);

  // Bucle de renderizado optimizado
  useEffect(() => {
    const render = () => {
      animationFrameId.current = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      
      // Limpiar canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Fondo espacial dinámico
      drawSpaceBackground(ctx);

      // Dibujar entidades del juego - Mostrar todas las naves de los jugadores
      players.forEach(p => drawPlayer(ctx, p));
      enemies.forEach(e => drawEnemy(ctx, e, level || 1));
      bullets.forEach(b => drawBullet(ctx, b));
      powerups.forEach(p => drawPowerup(ctx, p));
      coins.forEach(c => drawCoin(ctx, c));
      explosions.forEach(e => drawExplosion(ctx, e));
      
    };

    animationFrameId.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [players, enemies, bullets, powerups, coins, explosions, level, drawSpaceBackground, drawPlayer, drawEnemy, drawBullet, drawPowerup, drawCoin, drawExplosion]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      tabIndex={0} // Make canvas focusable for keyboard events
      onClick={() => canvasRef.current?.focus()} // Focus canvas on click
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        background: 'transparent',
        cursor: 'crosshair',
        pointerEvents: 'none', // Allow clicks to pass through to underlying elements
        zIndex: -1, // Even lower z-index to ensure it doesn't block other elements
        userSelect: 'none', // Prevent text selection
        outline: 'none', // Remove focus outline
      }}
    />
  );
};

export default GameCanvas;