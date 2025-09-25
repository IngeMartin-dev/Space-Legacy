// START OF FILE ShopScreen.jsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ArrowLeft, Coins, Crown, Zap, Heart, Shield, Anchor, Aperture, Gem, TrendingUp, Star, Target, Gauge, Users } from 'lucide-react';
import ShipPreview from './ShipPreview';


// Component for Upgrade/Pet preview
const ItemPreview = React.memo(({ id, color }) => {
  let IconComponent;
  let bgColor = color || '#FFFFFF';

  switch (id) {
    case 'fireRate': IconComponent = Zap; bgColor = '#FFFF00'; break;
    case 'damage': IconComponent = Target; bgColor = '#FF4444'; break;
    case 'mobility': IconComponent = Gauge; bgColor = '#44FF44'; break;
    case 'autoShooterPet': IconComponent = Aperture; bgColor = '#00FF00'; break;
    case 'magnetPet': IconComponent = Anchor; bgColor = '#00BFFF'; break;
    case 'healerPet': IconComponent = Heart; bgColor = '#FF69B4'; break;
    case 'shieldPet': IconComponent = Shield; bgColor = '#FFD700'; break;
    case 'speedPet': IconComponent = Zap; bgColor = '#FF4500'; break;
    case 'bombPet': IconComponent = Target; bgColor = '#8A2BE2'; break;
    case 'laserPet': IconComponent = Zap; bgColor = '#FF0000'; break;
    case 'teleportPet': IconComponent = Aperture; bgColor = '#9932CC'; break;
    case 'freezePet': IconComponent = Shield; bgColor = '#00FFFF'; break;
    case 'poisonPet': IconComponent = Target; bgColor = '#32CD32'; break;
    case 'explosionPet': IconComponent = Crown; bgColor = '#FFA500'; break;
    case 'dronePet': IconComponent = Users; bgColor = '#FF1493'; break;
    default: IconComponent = Gem;
  }

  return (
    <div className="w-16 h-10 flex items-center justify-center mx-auto bg-black/20 rounded-lg" style={{ backgroundColor: `${bgColor}30`, border: `1px solid ${bgColor}` }}>
      {IconComponent && <IconComponent size={32} color={bgColor} />}
    </div>
  );
});

const ShopScreen = ({ onBack, shopData, onBuyItem, onEquipItem, user }) => {
  const [powerupLevels, setPowerupLevels] = useState(() => {
    const saved = localStorage.getItem('powerupLevels');
    return saved ? JSON.parse(saved) : { fireRate: 1, damage: 1, mobility: 1 };
  });
  
  const upgradePowerup = (powerupId) => {
    const currentLevel = powerupLevels[powerupId] || 1;
    const maxLevel = 150;
    const baseCost = 100;
    const cost = Math.floor(baseCost * Math.pow(1.5, currentLevel - 1));
    
    if (currentLevel < maxLevel && (user.isAdmin || user.coins >= cost)) {
      const newLevels = { ...powerupLevels, [powerupId]: currentLevel + 1 };
      setPowerupLevels(newLevels);
      localStorage.setItem('powerupLevels', JSON.stringify(newLevels));
      
      if (!user.isAdmin) {
        user.coins -= cost;
      }
    }
  };
  
  // Clasificación organizada de la tienda
  const shopCategories = {
    ships: [
      { id: 'ship1', name: 'Interceptor', price: 0, description: 'Nave básica con disparo rápido especial.', previewColor: '#0077FF', special: 'Disparo Rápido' },
      { id: 'ship2', name: 'Crucero', price: 500, description: 'Nave equilibrada con escudo especial.', previewColor: '#00FF77', special: 'Escudo Automático' },
      { id: 'ship3', name: 'Destructor', price: 800, description: 'Nave élite con disparo triple especial.', previewColor: '#FF7700', special: 'Disparo Triple' },
      { id: 'ship4', name: 'Acorazado', price: 1200, description: 'Nave suprema con láser especial.', previewColor: '#FF0077', special: 'Láser Devastador' },
      { id: 'ship5', name: 'Sigilo', price: 1500, description: 'Nave furtiva con invisibilidad temporal.', previewColor: '#8A2BE2', special: 'Invisibilidad' },
      { id: 'ship6', name: 'Bombardero', price: 1800, description: 'Nave pesada con mega bombas.', previewColor: '#FF4500', special: 'Bombardero' },
      { id: 'ship7', name: 'Sanador', price: 2000, description: 'Nave de apoyo con regeneración.', previewColor: '#32CD32', special: 'Regeneración' },
      { id: 'ship8', name: 'Velocista', price: 2200, description: 'Nave ultra rápida con impulso.', previewColor: '#FFD700', special: 'Velocidad Extrema' },
      { id: 'ship9', name: 'Fénix', price: 2500, description: 'Nave legendaria con tormenta de fuego.', previewColor: '#FF6347', special: 'Tormenta de Fuego' },
      { id: 'ship10', name: 'Escarcha', price: 2700, description: 'Nave gélida con explosión helada.', previewColor: '#00BFFF', special: 'Explosión Helada' },
      { id: 'ship11', name: 'Trueno', price: 2900, description: 'Nave eléctrica con cadena relámpago.', previewColor: '#FFFF00', special: 'Cadena Eléctrica' },
      { id: 'ship12', name: 'Vacío', price: 3100, description: 'Nave oscura con agujero negro.', previewColor: '#800080', special: 'Agujero Negro' },
      { id: 'ship13', name: 'Cuantum', price: 3300, description: 'Nave cuántica con golpe teleportado.', previewColor: '#FF00FF', special: 'Golpe Teleportado' },
      { id: 'ship14', name: 'Cósmica', price: 3500, description: 'Nave estelar con barrera estelar.', previewColor: '#FFA500', special: 'Barrera Estelar' },
      { id: 'ship15', name: 'Nebulosa', price: 3700, description: 'Nave nebulosa con onda de plasma.', previewColor: '#9370DB', special: 'Onda de Plasma' },
      { id: 'ship16', name: 'Meteoro', price: 3900, description: 'Nave meteórica con lluvia de meteoros.', previewColor: '#DC143C', special: 'Lluvia de Meteoros' },
    ],
    
    upgrades: [
      { id: 'fireRate', name: 'Cadencia de Fuego', price: 300, description: 'Reduce el tiempo entre disparos. -2% por nivel.', previewColor: '#FFFF00', maxLevel: 150 },
      { id: 'damage', name: 'Potencia de Daño', price: 400, description: 'Aumenta el daño de tus proyectiles. +15% por nivel.', previewColor: '#FF4444', maxLevel: 150 },
      { id: 'mobility', name: 'Movilidad Mejorada', price: 350, description: 'Incrementa la velocidad de movimiento. +10% por nivel.', previewColor: '#44FF44', maxLevel: 150 },
    ],
    
    powerups: [
      { id: 'rapidFire', name: 'Disparo Rápido', price: 500, description: 'Disparo súper rápido temporal por 10 segundos.', previewColor: '#FFFF00' },
      { id: 'tripleShot', name: 'Disparo Triple', price: 800, description: 'Tres proyectiles simultáneos por 10 segundos.', previewColor: '#FF6347' },
      { id: 'speedBoost', name: 'Impulso de Velocidad', price: 600, description: 'Movimiento súper rápido por 10 segundos.', previewColor: '#32CD32' },
      { id: 'megaBomb', name: 'Mega Bomba', price: 1500, description: 'Destruye todos los enemigos en pantalla.', previewColor: '#FF1493' },
      { id: 'timeFreeze', name: 'Congelación Temporal', price: 1200, description: 'Ralentiza a todos los enemigos por 5 segundos.', previewColor: '#87CEEB' },
      { id: 'invincibility', name: 'Invencibilidad', price: 2000, description: 'Inmunidad total por 8 segundos.', previewColor: '#FFD700' },
      { id: 'shield', name: 'Escudo', price: 700, description: 'Protección contra un impacto por 15 segundos.', previewColor: '#00FFFF' },
      { id: 'galacticBomb', name: 'Bomba Galáctica', price: 2500, description: 'Explosión masiva que destruye todo.', previewColor: '#FF00FF' },
      { id: 'laserBeam', name: 'Rayo Láser', price: 1800, description: 'Láser continuo por 5 segundos.', previewColor: '#FF0000' },
      { id: 'multiShot', name: 'Disparo Múltiple', price: 1600, description: 'Dispara en 5 direcciones por 8 segundos.', previewColor: '#00FF80' },
    ],
    
    pets: [
      { id: 'autoShooterPet', name: 'Centinela Automático', price: 2000, description: 'Dispara automáticamente cada 350ms.', previewColor: '#00FF00' },
      { id: 'magnetPet', name: 'Recolector Magnético', price: 1500, description: 'Atrae objetos en radio de 220px.', previewColor: '#00BFFF' },
      { id: 'healerPet', name: 'Dron Médico', price: 2500, description: 'Regenera 1 vida cada 45 segundos.', previewColor: '#FF69B4', maxLevel: 50 },
      { id: 'shieldPet', name: 'Escudo Orbital', price: 2200, description: 'Escudo automático cada 30 segundos.', previewColor: '#FFD700', maxLevel: 50 },
      { id: 'speedPet', name: 'Impulsor Cuántico', price: 1800, description: 'Velocidad +50% cada 25 segundos.', previewColor: '#FF4500', maxLevel: 50 },
      { id: 'bombPet', name: 'Bombardero Mini', price: 3000, description: 'Lanza mini bombas cada 20 segundos.', previewColor: '#8A2BE2', maxLevel: 50 },
      { id: 'laserPet', name: 'Láser Guardián', price: 3500, description: 'Dispara láseres cada 15 segundos.', previewColor: '#FF0000', maxLevel: 50 },
      { id: 'teleportPet', name: 'Teleportador', price: 2800, description: 'Teletransporta enemigos cada 40 segundos.', previewColor: '#9932CC', maxLevel: 50 },
      { id: 'freezePet', name: 'Congelador', price: 3200, description: 'Congela enemigos cada 35 segundos.', previewColor: '#00FFFF', maxLevel: 50 },
      { id: 'poisonPet', name: 'Envenenador', price: 2600, description: 'Envenena enemigos cada 30 segundos.', previewColor: '#32CD32', maxLevel: 50 },
      { id: 'explosionPet', name: 'Explosivo', price: 4000, description: 'Crea explosiones cada 50 segundos.', previewColor: '#FFA500', maxLevel: 50 },
      { id: 'dronePet', name: 'Enjambre de Drones', price: 3800, description: 'Lanza drones de ataque cada 45 segundos.', previewColor: '#FF1493', maxLevel: 50 },
    ]
  };

  // Add admin ships if user is admin
  if (user.isAdmin) {
    shopCategories.ships.push(
      { id: 'admin1', name: 'Nave Real', price: 0, description: 'Exclusiva para administradores con mega bomba.', adminOnly: true, previewColor: '#FFD700', special: 'Mega Bomba' },
      { id: 'admin2', name: 'Nave Estelar', price: 0, description: 'Legendaria con invencibilidad especial.', adminOnly: true, previewColor: '#FF69B4', special: 'Invencibilidad' }
    );
    
    // Nave especial solo para admin especial
    if (user.isSpecialAdmin) {
      shopCategories.ships.push(
        { id: 'heartShip', name: 'Nave del Amor', price: 0, description: 'Nave exclusiva con rayo de amor devastador.', adminOnly: true, specialAdmin: true, previewColor: '#FF1493', special: 'Rayo de Amor' }
      );
    }
  }

  const getDisplayItems = useCallback((category) => {
    const userUnlockedShips = new Set(user.unlockedShips || []);
    const userUnlockedUpgrades = new Set(user.unlockedUpgrades || []);
    const userUnlockedPets = new Set(user.unlockedPets || []);

    // Debug logging for pets
    if (category === 'pets') {
      console.log('🐾 Depuración de Mascotas:', {
        shopCategoriesPets: shopCategories.pets,
        userUnlockedPets: Array.from(userUnlockedPets),
        userIsAdmin: user.isAdmin,
        petsLength: shopCategories.pets?.length || 0
      });
    }

    if (!shopCategories[category]) {
      console.warn(`Categoría ${category} no encontrada en shopCategories`);
      return [];
    }

    return shopCategories[category].map(item => {
      // Filtrar nave especial del admin especial
      if (item.specialAdmin && !user.isSpecialAdmin) {
        return null;
      }

      let isOwned = false;
      if (category === 'ships') isOwned = userUnlockedShips.has(item.id) || (item.id === 'ship1');
      if (category === 'upgrades') isOwned = true; // Upgrades are always available
      if (category === 'pets') isOwned = userUnlockedPets.has(item.id); // Pets show as owned if unlocked
      if (category === 'powerups') isOwned = true; // Power-ups are consumables

      if (user.isAdmin) isOwned = true;
      if (item.adminOnly) isOwned = true;

      let isEquipped = false;
      if (category === 'ships') isEquipped = user.equippedShip === item.id;
      if (category === 'pets') isEquipped = user.equippedPet === item.id;

      return {
        ...item,
        type: category.slice(0, -1),
        isOwned,
        isEquipped,
        canAfford: user.isAdmin || (user.coins || 0) >= item.price,
      };
    }).filter(Boolean).sort((a,b) => {
      if (a.isEquipped && !b.isEquipped) return -1;
      if (!a.isEquipped && b.isEquipped) return 1;
      if (a.isOwned && !b.isOwned) return -1;
      if (!a.isOwned && b.isOwned) return 1;
      return a.price - b.price;
    });
  }, [shopCategories, user]);

  const [activeCategory, setActiveCategory] = useState('ships');

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

      <button onClick={onBack} className="absolute top-8 left-8 flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors transform hover:scale-105 shadow-md z-30 pointer-events-auto" style={{ pointerEvents: 'auto', zIndex: 30 }}>
        <ArrowLeft size={20} />
        <span>VOLVER</span>
      </button>
      
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-glow">TIENDA GALÁCTICA</h1>
        <div className="flex items-center justify-center space-x-2 text-2xl text-yellow-400">
          <Coins size={24} />
          <span>Monedas: {user.isAdmin ? '∞' : (user.coins || 0).toLocaleString()}</span>
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-8" style={{ pointerEvents: 'auto', zIndex: 100 }}>
        {Object.keys(shopCategories).map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`shop-button px-6 py-3 rounded-lg font-semibold transition-all ${
              activeCategory === category
                ? 'bg-blue-600 text-white scale-105'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            style={{ pointerEvents: 'auto', zIndex: 100 }}
          >
            {category === 'ships' && '🚀 NAVES'}
            {category === 'upgrades' && '⚡ MEJORAS'}
            {category === 'powerups' && '💎 POWER-UPS'}
            {category === 'pets' && '🤖 MASCOTAS'}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl overflow-y-auto custom-scrollbar p-2 shop-scroll-container" style={{
        maxHeight: 'calc(100vh - 250px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        pointerEvents: 'auto',
        zIndex: 50,
        position: 'relative'
      }}>
        {getDisplayItems(activeCategory).length > 0 ? getDisplayItems(activeCategory).map((item) => {
          return (
            <div key={item.id} className={`bg-black/50 rounded-2xl p-6 border-2 transition-all duration-300 flex flex-col justify-between ${item.isEquipped ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-400/20' : item.isOwned ? 'border-green-500' : 'border-purple-500'} hover:scale-105 hover:shadow-2xl`}>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2 flex items-center justify-center space-x-2">
                  <span>{item.name}</span>
                  {item.adminOnly && <Crown className="text-yellow-400" size={20} />}
                </h3>
                <p className="text-gray-300 text-sm mb-4 h-12">{item.description}</p>

                {/* Special ability indicator for ships */}
                {item.special && (
                  <div className="mb-2 text-xs text-yellow-300 bg-yellow-900/30 rounded px-2 py-1">
                    <Star size={12} className="inline mr-1" />
                    Especial: {item.special}
                  </div>
                )}

                <div className="mb-4 h-[50px] flex items-center justify-center">
                  {activeCategory === 'ships' ? (
                    <ShipPreview ship={item.id} color={item.previewColor} />
                  ) : (
                    <ItemPreview id={item.id} color={item.previewColor} />
                  )}
                </div>
              </div>

              {/* Upgrade section for upgrades */}
              {activeCategory === 'upgrades' && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="flex items-center space-x-1">
                      <TrendingUp size={14} />
                      <span>Nivel: {powerupLevels[item.id] || 1}/{item.maxLevel}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((powerupLevels[item.id] || 1) / item.maxLevel) * 100}%` }}
                    ></div>
                  </div>
                  <button
                    onClick={() => upgradePowerup(item.id)}
                    disabled={(powerupLevels[item.id] || 1) >= item.maxLevel || (!user.isAdmin && user.coins < Math.floor(100 * Math.pow(1.5, (powerupLevels[item.id] || 1) - 1)))}
                    className="shop-button w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-2 py-2 rounded text-sm transition-colors"
                  >
                    {(powerupLevels[item.id] || 1) >= item.maxLevel ? 'MÁXIMO' : `Mejorar (${Math.floor(100 * Math.pow(1.5, (powerupLevels[item.id] || 1) - 1)).toLocaleString()} 💰)`}
                  </button>
                </div>
              )}

              {/* Pet upgrade section */}
              {activeCategory === 'pets' && item.maxLevel && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="flex items-center space-x-1">
                      <TrendingUp size={14} />
                      <span>Nivel: {powerupLevels[item.id] || 1}/{item.maxLevel}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((powerupLevels[item.id] || 1) / item.maxLevel) * 100}%` }}
                    ></div>
                  </div>
                  <button
                    onClick={() => upgradePowerup(item.id)}
                    disabled={(powerupLevels[item.id] || 1) >= item.maxLevel || (!user.isAdmin && user.coins < Math.floor(200 * Math.pow(1.8, (powerupLevels[item.id] || 1) - 1)))}
                    className="shop-button w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-2 py-2 rounded text-sm transition-colors"
                  >
                    {(powerupLevels[item.id] || 1) >= item.maxLevel ? 'MÁXIMO' : `Mejorar (${Math.floor(200 * Math.pow(1.8, (powerupLevels[item.id] || 1) - 1)).toLocaleString()} 💰)`}
                  </button>
                </div>
              )}

              <div className="mt-auto">
                {item.isOwned && activeCategory !== 'powerups' && activeCategory !== 'upgrades' ? (
                    item.isEquipped ? (
                      <div className="bg-green-600 px-4 py-3 rounded-lg text-center font-bold text-white">
                        <Star size={16} className="inline mr-2" />
                        EQUIPADO
                      </div>
                    ) : (
                      <button onClick={() => onEquipItem(item.id, item.type)} className="shop-button bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors w-full font-semibold">
                        EQUIPAR
                      </button>
                    )
                ) : activeCategory !== 'upgrades' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-yellow-400 font-bold text-lg">
                      <Coins size={18} />
                      <span>{item.adminOnly ? 'GRATIS' : item.price.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => onBuyItem(item.id, item.price, item.type)}
                      disabled={!item.canAfford && !item.adminOnly}
                      className={`shop-button px-4 py-3 rounded-lg transition-colors w-full font-semibold ${item.canAfford || item.adminOnly ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 cursor-not-allowed'}`}
                    >
                      {activeCategory === 'powerups' ? 'OBTENER' : (item.canAfford || item.adminOnly ? 'COMPRAR' : 'SIN FONDOS')}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full bg-black/50 rounded-2xl p-8 border-2 border-gray-500 text-center">
            <h3 className="text-xl font-bold mb-4 text-gray-300">No hay items disponibles</h3>
            <p className="text-gray-400">¡Gana más monedas para desbloquear items en esta categoría!</p>
            {activeCategory === 'pets' && (
              <p className="text-xs text-gray-500 mt-2">Debug: Revisa la consola para más información sobre las mascotas</p>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center text-gray-400">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-black/30 rounded-lg p-3">
            <h4 className="text-yellow-400 font-bold mb-1">🚀 NAVES</h4>
            <p>Cada nave tiene un power-up especial único</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <h4 className="text-blue-400 font-bold mb-1">⚡ MEJORAS</h4>
            <p>Permanentes, hasta nivel 150 cada una</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <h4 className="text-purple-400 font-bold mb-1">💎 POWER-UPS</h4>
            <p>Efectos temporales durante la partida</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <h4 className="text-green-400 font-bold mb-1">🤖 MASCOTAS</h4>
            <p>Compañeros que te ayudan automáticamente</p>
          </div>
        </div>
        <p className="mt-4">Gana monedas destruyendo enemigos y completando niveles.</p>
        {user.isAdmin && (<p className="text-yellow-400 mt-2">✨ Como admin tienes acceso ilimitado a todo.</p>)}
      </div>
    </div>
  );
};

export default ShopScreen;
// END OF FILE ShopScreen.jsx