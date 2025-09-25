import React, { useState } from 'react';
import { User, Mail, Lock, X, Loader } from 'lucide-react';
import { userService } from '../lib/supabase';

const RegisterModal = ({ isOpen, onClose, onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El correo electrónico es obligatorio');
      return false;
    }
    if (!formData.password) {
      setError('La contraseña es obligatoria');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // Check if username or email already exists
      const [usernameExists, emailExists] = await Promise.all([
        userService.usernameExists(formData.username),
        userService.emailExists(formData.email)
      ]);

      if (usernameExists) {
        setError('Este nombre de usuario ya está registrado');
        return;
      }

      if (emailExists) {
        setError('Este correo electrónico ya está registrado');
        return;
      }

      // Admin is determined by username/password during login, not during registration
      const isAdmin = false;

      // Create user data
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        isAdmin,
        isSpecialAdmin: isAdmin,
        coins: 1000, // Starting coins for new users
        unlockedShips: ['ship1'],
        equippedShip: 'ship1',
        unlockedUpgrades: [],
        equippedUpgrade: null,
        unlockedPets: [],
        equippedPet: null,
        avatar: '👨‍🚀',
        settings: {},
        petLevels: {}
      };

      // Save to Supabase
      console.log('📝 Registrando usuario en Supabase:', userData);
      const savedUser = await userService.upsertUser(userData);
      console.log('✅ Usuario guardado en Supabase:', savedUser);

      // Auto-login after registration
      onLogin(userData);
      onClose();

    } catch (error) {
      console.error('❌ Error completo de registro:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      if (error.code === 'PGRST116') {
        setError('Error de conexión con la base de datos. Verifica tu configuración de Supabase.');
      } else if (error.code === '23505') {
        setError('El usuario o email ya existe.');
      } else if (error.message?.includes('JWT')) {
        setError('Error de autenticación con Supabase. Verifica las claves API.');
      } else {
        setError(`Error al registrar: ${error.message || 'Desconocido'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 font-orbitron">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 w-full max-w-md border-2 border-purple-500 shadow-2xl shadow-purple-500/50 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-purple-300 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8">
          REGISTRARSE
        </h2>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2 text-purple-300">Nombre de Usuario</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full bg-gray-800/80 border-2 border-purple-500/50 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all"
                placeholder="Tu nombre de usuario"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2 text-purple-300">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-gray-800/80 border-2 border-purple-500/50 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all"
                placeholder="tu@email.com"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2 text-purple-300">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-gray-800/80 border-2 border-purple-500/50 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all"
                placeholder="Tu contraseña"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-2 text-purple-300">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full bg-gray-800/80 border-2 border-purple-500/50 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all"
                placeholder="Confirma tu contraseña"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-600/30 border-2 border-red-500 rounded-xl p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 px-8 py-4 rounded-xl font-bold text-xl text-white flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin" size={24} />
                <span>REGISTRANDO...</span>
              </>
            ) : (
              <span>CREAR CUENTA</span>
            )}
          </button>
        </form>

        {/* Admin notice removed - admin is determined by username/password during login */}
      </div>
    </div>
  );
};

export default RegisterModal;