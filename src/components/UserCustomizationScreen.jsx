// START OF FILE UserCustomizationScreen.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Save } from 'lucide-react';

const UserCustomizationScreen = ({ user, onUpdateUser, onBack }) => {
  const [localUsername, setLocalUsername] = useState(user?.username || '');
  const [localAvatar, setLocalAvatar] = useState(user?.avatar || '👨‍🚀');
  const [isSaving, setIsSaving] = useState(false);

  // Predefined avatar options
  const avatars = ['👨‍🚀', '👩‍🚀', '🚀', '👽', '🤖', '👾', '⭐', '✨', '🪐', '☄️']; // Added a couple more for variety

  useEffect(() => {
    // Synchronize if the user changes while this screen is open
    setLocalUsername(user?.username || '');
    setLocalAvatar(user?.avatar || '👨‍🚀');
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate an asynchronous save operation
    await new Promise(resolve => setTimeout(resolve, 500)); 

    // Update the user via the function provided by App.jsx
    onUpdateUser({
      ...user, // Pass all existing user data
      username: localUsername,
      avatar: localAvatar
    });
    setIsSaving(false);
    onBack(); // Return to the previous screen
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-8 font-orbitron relative overflow-hidden">
      {/* Animated Background - Same as LoginScreen */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-indigo-900/30"></div>
      
      {/* Animated Stars */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-blue-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-purple-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-indigo-300 rounded-full animate-twinkle-delayed"></div>
      </div>

      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors transform hover:scale-105 shadow-md z-10" // Enhanced decoration
      >
        <ArrowLeft size={20} />
        <span>VOLVER</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent animate-glow">
          PERSONALIZAR PERFIL
        </h1>
        <p className="text-gray-300">Modifica tu identidad galáctica</p>
      </div>

      <div className="bg-black/50 rounded-2xl p-8 w-full max-w-md border border-blue-500 shadow-2xl shadow-blue-500/20"> {/* Enhanced decoration */}
        <div className="mb-6">
          <label className="block text-xl font-bold mb-3 text-center">Avatar</label>
          <div className="text-7xl mb-4 text-center">{localAvatar}</div>
          <div className="grid grid-cols-4 gap-4 max-h-40 overflow-y-auto custom-scrollbar p-1"> {/* Added custom-scrollbar */}
            {avatars.map((avatar, index) => (
              <button
                key={index}
                onClick={() => setLocalAvatar(avatar)}
                className={`p-3 rounded-lg border-2 ${localAvatar === avatar ? 'border-blue-400 scale-110 shadow-lg' : 'border-gray-600 hover:border-gray-400'} transition-all text-4xl bg-gray-800 hover:bg-gray-700`} // Enhanced decoration
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xl font-bold mb-3 text-center">Nombre de Usuario</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              className="w-full bg-gray-800 border border-blue-500 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" // Enhanced input style
              maxLength={15}
              placeholder="Tu nombre en la galaxia"
              disabled={isSaving}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || !localUsername.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg font-semibold text-xl transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg shadow-blue-900/40" // Enhanced button style
        >
          {isSaving ? (
            <>
              <Save className="animate-spin" size={20} />
              <span>GUARDANDO...</span>
            </>
          ) : (
            <>
              <Save size={24} />
              <span>GUARDAR CAMBIOS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserCustomizationScreen;
// END OF FILE UserCustomizationScreen.jsx