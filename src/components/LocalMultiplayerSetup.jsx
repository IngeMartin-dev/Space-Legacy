// START OF FILE LocalMultiplayerSetup.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Users, Gamepad2, Palette } from 'lucide-react';

// Componente de vista previa reutilizable
const ShipPreview = React.memo(({ ship, color }) => { // Memoize for performance
  const canvasRef = useRef(null);

  const drawShip = useCallback((ctx) => {
    ctx.clearRect(0, 0, 60, 40); // Limpia el canvas
    ctx.save();
    ctx.translate(5, 5); // Centra un poco el dibujo
    
    // Dibuja la nave
    ctx.fillStyle = color;
    const w = 50, h = 30; // Ajustar a un tamaño más pequeño para la vista previa
    const x = 0, y = 0; // Posición de dibujo dentro del canvas de preview

    switch (ship) {
      case 'ship1': // Triangle-like
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        break;
      case 'ship2': // More sleek, with side wings
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w * 0.9, y + h * 0.4);
        ctx.lineTo(x + w * 0.7, y + h);
        ctx.lineTo(x + w * 0.3, y + h);
        ctx.lineTo(x + w * 0.1, y + h * 0.4);
        ctx.closePath();
        break;
      case 'ship3': // Rounded, almost saucer-like
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 3, 0, 0, Math.PI * 2);
        break;
      case 'ship4': // Blocky, powerful look
        ctx.fillRect(x + w * 0.1, y + h * 0.2, w * 0.8, h * 0.6); // Main body
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w * 0.8, y + h * 0.2);
        ctx.lineTo(x + w * 0.2, y + h * 0.2);
        ctx.closePath();
        ctx.fill(); // Top part
        break;
      case 'admin1': // Royal Ship (more angular and complex)
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h * 0.7);
        ctx.lineTo(x + w * 0.7, y + h);
        ctx.lineTo(x + w * 0.3, y + h);
        ctx.lineTo(x, y + h * 0.7);
        ctx.closePath();
        break;
      case 'admin2': // Stellar Ship (star-shaped or highly geometric)
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
      default:
        ctx.fillRect(x, y, w, h);
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

  return <canvas ref={canvasRef} width="60" height="40" className="bg-black/20 rounded" />;
});

const LocalMultiplayerSetup = ({ onBack, onStartGame, user, controls }) => { // Pasar controls como prop
  const [numPlayers, setNumPlayers] = useState(1); // Default a 1 jugador
  const [remapping, setRemapping] = useState(null);
  
  // Define a set of default player configurations for local multiplayer
  const initialLocalPlayerConfigs = [
    // Player 1 (main user)
    { id: 'local-player-0', name: user.username, color: '#0077FF', ship: user.equippedShip || 'ship1', avatar: user.avatar, controls: controls.p1 },
    // Other local players with default names/colors/ships
    { id: 'local-player-1', name: 'Jugador 2', color: '#FF0000', ship: 'ship1', avatar: '🤖', controls: controls.p2 },
    { id: 'local-player-2', name: 'Jugador 3', color: '#00FF00', ship: 'ship1', avatar: '👾', controls: controls.p3 },
    { id: 'local-player-3', name: 'Jugador 4', color: '#FFFF00', ship: 'ship1', avatar: '🚀', controls: controls.p4 }
  ];

  const [playerConfigs, setPlayerConfigs] = useState(initialLocalPlayerConfigs);

  useEffect(() => {
    // Attempt to load saved configurations
    const savedConfigs = localStorage.getItem('spaceInvadersLocalMultiplayerConfigs');
    if (savedConfigs) {
      try {
        const parsedConfigs = JSON.parse(savedConfigs);
        setPlayerConfigs(prev => {
          const updated = initialLocalPlayerConfigs.map((initialCfg, idx) => {
            const savedCfg = parsedConfigs[idx] || {};
            return {
              ...initialCfg, // Use initial defaults as base
              ...savedCfg, // Overlay with saved data
              // Always ensure player 1 uses current user's data
              ...(idx === 0 ? { name: user.username, ship: user.equippedShip || 'ship1', avatar: user.avatar } : {}),
              // Always ensure controls are from the latest `controls` prop passed down from App
              controls: controls[`p${idx + 1}`] || initialCfg.controls,
              id: initialCfg.id // Keep the stable local ID
            };
          });
          // Ensure we always have 4 config slots, even if saved data was shorter
          while (updated.length < 4) {
            updated.push(initialLocalPlayerConfigs[updated.length]);
          }
          return updated;
        });
      } catch (e) {
        console.error("Error al parsear configuraciones locales:", e);
        // If there's an error, fall back to initial default configurations
        setPlayerConfigs(initialLocalPlayerConfigs.map((cfg,idx) => ({ ...cfg, controls: controls[`p${idx+1}`] || cfg.controls })));
      }
    } else {
      // If no saved configs, just set initial configs, ensuring player 1 is correct
      setPlayerConfigs(initialLocalPlayerConfigs.map((cfg,idx) => ({ ...cfg, controls: controls[`p${idx+1}`] || cfg.controls })));
    }
  }, [user, controls]); // Dependencia 'user' and 'controls' to re-initialize on user/controls change

  useEffect(() => {
    // Save current player configurations whenever they change
    localStorage.setItem('spaceInvadersLocalMultiplayerConfigs', JSON.stringify(playerConfigs));
  }, [playerConfigs]);

  const handleRemapClick = (playerIndex, control) => {
    setRemapping({ playerIndex, control });
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (remapping) {
        e.preventDefault();
        // Prevent remapping to 'P' (Pause), 'Escape' (Back/Cancel), or 'B' (Back)
        if (e.code === 'KeyP' || e.code === 'Escape' || e.code === 'KeyB') {
          setRemapping(null);
          return;
        }

        const { playerIndex, control } = remapping;
        setPlayerConfigs(prev => {
          const newConfigs = [...prev];
          newConfigs[playerIndex] = {
            ...newConfigs[playerIndex],
            controls: {
              ...newConfigs[playerIndex].controls,
              [control]: e.code
            }
          };
          return newConfigs;
        });
        setRemapping(null);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [remapping]); 

  const colors = ['#0077FF', '#FF0000', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];
  const allShips = [
    { id: 'ship1', name: 'Nave Básica' }, { id: 'ship2', name: 'Nave Avanzada' },
    { id: 'ship3', name: 'Nave Élite' }, { id: 'ship4', name: 'Nave Suprema' },
    { id: 'ship5', name: 'Nave Sigilo' }, { id: 'ship6', name: 'Bombardero' },
    { id: 'ship7', name: 'Sanador' }, { id: 'ship8', name: 'Velocista' },
    { id: 'ship9', name: 'Fénix' }, { id: 'ship10', name: 'Escarcha' },
    { id: 'ship11', name: 'Trueno' }, { id: 'ship12', name: 'Vacío' },
    { id: 'ship13', name: 'Cuantum' }, { id: 'ship14', name: 'Cósmica' },
    { id: 'ship15', name: 'Nebulosa' }, { id: 'ship16', name: 'Meteoro' },
    { id: 'admin1', name: 'Nave Real' }, { id: 'admin2', name: 'Nave Estelar' }
  ];
  
  // Añadir nave especial para admin especial
  if (user.isSpecialAdmin) {
    allShips.push({ id: 'heartShip', name: 'Nave del Amor' });
  }
  
  // Filter available ships based on user's unlocked ships or admin status
  const availableShips = allShips.filter(ship => user.isAdmin || (user.unlockedShips || []).includes(ship.id));
  const avatars = ['👨‍🚀', '👩‍🚀', '🚀', '👽', '🤖', '👾', '⭐', '✨', '🪐', '☄️']; // Added from UserCustomizationScreen


  const updatePlayerConfig = (index, field, value) => {
    setPlayerConfigs(prev => {
      const newConfigs = [...prev];
      if (newConfigs[index]) { 
        newConfigs[index] = { ...newConfigs[index], [field]: value };
      }
      return newConfigs;
    });
  };

  const handleStartGameClick = () => { 
    // Filter active player configurations
    const activePlayersConfig = playerConfigs.slice(0, numPlayers).map((config, index) => ({
      ...config,
      // Clone the controls object to avoid direct state mutation from initial `controls` prop
      controls: { ...config.controls },
      // All local multiplayer players are 'local' to this client
      isLocal: true,
      isMultiplayer: false,
      // Only the first local player inherits admin properties from the logged-in user
      isAdmin: index === 0 ? user.isAdmin : false,
      settings: index === 0 ? (user.settings || {}) : {},
      // Equipped upgrade/pet are passed from App.jsx to useGameState,
      // so no need to explicitly pass them here from playerConfigs
    }));
    onStartGame(activePlayersConfig);
  };

  return (
    <div className="shop-container flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-8 font-orbitron relative overflow-auto" style={{ pointerEvents: 'auto', zIndex: 1 }}>
      {/* Animated Background - Same as LoginScreen */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-indigo-900/30"></div>
      
      {/* Animated Stars */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-blue-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-purple-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-indigo-300 rounded-full animate-twinkle-delayed"></div>
      </div>

      <button onClick={onBack} className="shop-button absolute top-8 left-8 flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors transform hover:scale-105 shadow-md"> {/* Added transform and shadow */}
        <ArrowLeft size={20} />
        <span>VOLVER</span>
      </button>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-glow">MULTIJUGADOR LOCAL</h1>
        <div className="flex items-center justify-center space-x-2 text-gray-300"><Users size={24} /><span>Configura hasta 4 jugadores</span></div>
      </div>
      <div className="bg-black/50 rounded-2xl p-8 w-full max-w-6xl border border-purple-600 shadow-2xl shadow-purple-900/40"> {/* Added border and shadow for decoration */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Número de Jugadores</h2>
          <div className="flex justify-center space-x-4">
            {[1, 2, 3, 4].map(num => (
              <button key={num} onClick={() => setNumPlayers(num)} className={`shop-button px-6 py-3 rounded-lg transition-colors transform hover:scale-105 shadow-md ${numPlayers === num ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}> {/* Added transform and shadow */}
                {num} Jugador{num > 1 ? 'es' : ''}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto overflow-x-hidden pr-4 grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar shop-scroll-container" style={{ pointerEvents: 'auto', zIndex: 50 }}>
          {Array.from({ length: numPlayers }).map((_, index) => (
            <div key={playerConfigs[index]?.id || `player-config-${index}`} className="bg-purple-800/30 rounded-lg p-6 space-y-4 border border-purple-500 shadow-md max-h-96 overflow-y-auto overflow-x-hidden custom-scrollbar" style={{ pointerEvents: 'auto' }}> {/* Added scrolling */}
              <h3 className="text-xl font-bold flex items-center space-x-2"><Gamepad2 size={20} /><span>Jugador {index + 1} {index === 0 ? "(Tú)" : ""}</span></h3>
              <div>
                <label className="block text-sm font-medium mb-2">Nombre:</label>
                <input type="text" value={playerConfigs[index]?.name || ''} onChange={e => updatePlayerConfig(index, 'name', e.target.value)} className="w-full bg-gray-800 border border-purple-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" maxLength={12} disabled={index === 0} /> {/* Disabled for player 1 */}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Avatar:</label>
                <div className="max-h-24 overflow-y-auto custom-scrollbar shop-scroll-container">
                  <div className="grid grid-cols-5 gap-2">
                      {avatars.map(a => (
                          <button
                              key={a}
                              onClick={() => updatePlayerConfig(index, 'avatar', a)}
                              className={`shop-button w-10 h-10 text-xl flex-shrink-0 rounded-full border-2 transition-all flex items-center justify-center ${playerConfigs[index]?.avatar === a ? 'border-purple-400 bg-purple-600/30 scale-110' : 'border-gray-400 bg-gray-700/50 hover:border-purple-300 hover:bg-purple-500/20 hover:scale-105'}`}
                              disabled={index === 0} // Disabled for player 1
                          >
                              {a}
                          </button>
                      ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color:</label>
                <div className="max-h-20 overflow-y-auto custom-scrollbar shop-scroll-container">
                  <div className="grid grid-cols-4 gap-2">
                      {colors.map(c => (
                          <button
                              key={c}
                              onClick={() => updatePlayerConfig(index, 'color', c)}
                              className={`shop-button w-8 h-8 flex-shrink-0 rounded-full border-2 transition-all ${playerConfigs[index]?.color === c ? 'border-purple-400 scale-110 shadow-lg shadow-purple-400/50' : 'border-gray-400 hover:border-purple-300 hover:scale-105'}`}
                              style={{ backgroundColor: c }}
                          />
                      ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nave:</label>
                <div className="max-h-32 overflow-y-auto custom-scrollbar shop-scroll-container">
                  <div className="grid grid-cols-2 gap-2">
                    {availableShips.map(ship => (
                      <button
                        key={ship.id}
                        onClick={() => updatePlayerConfig(index, 'ship', ship.id)}
                        disabled={index === 0}
                        className={`shop-button p-2 rounded-lg border-2 transition-all flex flex-col items-center space-y-1 ${
                          playerConfigs[index]?.ship === ship.id
                            ? 'border-purple-400 bg-purple-600/30 scale-105'
                            : 'border-gray-600 bg-gray-700/50 hover:border-purple-300 hover:bg-purple-500/20'
                        } ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                      >
                        <ShipPreview ship={ship.id} color={playerConfigs[index]?.color || '#FFFFFF'} />
                        <span className="text-xs text-center">{ship.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Controles:</label>
                <div className="flex items-center justify-between gap-4">
                  <button onClick={() => handleRemapClick(index, 'left')} className="shop-button flex-1 bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-center font-mono transition-colors transform hover:scale-105">{remapping?.playerIndex === index && remapping.control === 'left' ? '...' : (playerConfigs[index]?.controls?.left || 'N/A')}</button>
                  <button onClick={() => handleRemapClick(index, 'right')} className="shop-button flex-1 bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-center font-mono transition-colors transform hover:scale-105">{remapping?.playerIndex === index && remapping.control === 'right' ? '...' : (playerConfigs[index]?.controls?.right || 'N/A')}</button>
                  <button onClick={() => handleRemapClick(index, 'shoot')} className="shop-button flex-1 bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-center font-mono transition-colors transform hover:scale-105">Disparo: {remapping?.playerIndex === index && remapping.control === 'shoot' ? '...' : (playerConfigs[index]?.controls?.shoot || 'N/A')}</button>
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 flex items-center justify-between border border-gray-700"> {/* Added border for preview */}
                <span className="text-sm text-gray-300">Vista previa:</span>
                <ShipPreview ship={playerConfigs[index]?.ship || 'ship1'} color={playerConfigs[index]?.color || '#FFFFFF'} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <button onClick={handleStartGameClick} className="shop-button bg-green-600 hover:bg-green-700 px-12 py-4 rounded-lg text-xl font-semibold transition-colors transform hover:scale-105 shadow-lg shadow-green-900/40">INICIAR PARTIDA</button> {/* Enhanced button style */}
        </div>
      </div>
    </div>
  );
};

export default LocalMultiplayerSetup;
// END OF FILE LocalMultiplayerSetup.jsx