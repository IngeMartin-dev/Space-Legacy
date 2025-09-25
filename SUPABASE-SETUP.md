# Supabase Setup Guide

## 🚀 Configuración de Base de Datos para Space Invaders

### Paso 1: Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se configure el proyecto

### Paso 2: Configurar variables de entorno
1. En la raíz de tu proyecto, edita el archivo `.env`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

2. Obtén estas claves desde:
   - **URL**: Settings → API → Project URL
   - **Anon Key**: Settings → API → Project API keys → anon public

### Paso 3: Crear tabla de usuarios
1. Ve al **SQL Editor** en Supabase
2. Ejecuta el contenido del archivo `supabase-setup.sql`

### Paso 4: Configurar Row Level Security (RLS)
El archivo SQL incluye políticas RLS básicas. Si Supabase te muestra una advertencia sobre políticas faltantes:

#### Para tabla "users":
Las políticas ya están incluidas en el SQL.

#### Para tabla "Space Legacy" (si creaste la tabla con este nombre):

**Paso 1: Verifica la estructura de tu tabla**
```sql
-- Ejecuta esto para ver qué columnas tiene tu tabla
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'Space Legacy' AND table_schema = 'public';
```

**Paso 2: Identifica la columna de usuario**
- Si tiene columna `user_id` → usa las políticas tal cual
- Si tiene columna `id` → cambia `user_id` por `id` en las políticas
- Si tiene otro nombre → usa ese nombre en las políticas

**Paso 3: Ejecuta las políticas corregidas**
Ejecuta estas políticas en el SQL Editor de Supabase (ajusta el nombre de columna si es necesario):

```sql
-- Habilitar RLS en la tabla Space Legacy
ALTER TABLE "Space Legacy" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Space legacy owners can read" ON "Space Legacy";
DROP POLICY IF EXISTS "Space legacy owners can insert" ON "Space Legacy";
DROP POLICY IF EXISTS "Space legacy owners can update" ON "Space Legacy";
DROP POLICY IF EXISTS "Space legacy owners can delete" ON "Space Legacy";

-- Crear políticas RLS para tabla Space Legacy
CREATE POLICY "Space legacy owners can read"
ON "Space Legacy"
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Space legacy owners can insert"
ON "Space Legacy"
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Space legacy owners can update"
ON "Space Legacy"
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Space legacy owners can delete"
ON "Space Legacy"
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_space_legacy_user_id ON "Space Legacy"(user_id);
```

```sql
-- Permitir lectura/escritura para todos (desarrollo)
-- En producción, configura políticas más restrictivas
```

### Paso 5: Probar la conexión
1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. **Registro obligatorio**: Los usuarios deben registrarse para jugar
3. Crea una cuenta con usuario, email y contraseña
4. Los datos se guardarán automáticamente en Supabase
5. Cada usuario tiene su propio progreso aislado

## 📊 Estructura de la Base de Datos

### Tabla `users`
- `id`: ID único del usuario
- `username`: Nombre de usuario (único)
- `email`: Correo electrónico (único, opcional)
- `password`: Contraseña (hasheada en producción)
- `avatar`: Emoji del avatar
- `coins`: Monedas del jugador
- `is_admin`: Si es administrador
- `is_special_admin`: Si es admin especial
- `equipped_ship`: Nave equipada
- `equipped_upgrade`: Mejora equipada
- `equipped_pet`: Mascota equipada
- `unlocked_ships`: Array de naves desbloqueadas
- `unlocked_upgrades`: Array de mejoras desbloqueadas
- `unlocked_pets`: Array de mascotas desbloqueadas
- `pet_levels`: Niveles de las mascotas (JSON)
- `settings`: Configuraciones del usuario (JSON)
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

## 🔧 Funcionalidades Implementadas

### ✅ Persistencia de Datos
- **Monedas**: Se guardan automáticamente
- **Compras**: Items comprados se registran
- **Equipamiento**: Cambios de equipo se guardan
- **Progreso**: Niveles de mascotas y mejoras
- **Registro de usuarios**: Sistema completo con email
- **Login flexible**: Soporta usuario o email
- **Admin automático**: Usuario/contraseña específicos se hacen admin automáticamente

### ✅ Sistema de Cuentas
- **Registro obligatorio**: Debes registrarte para jugar
- **Login persistente**: Mantiene sesión entre dispositivos
- **Datos únicos**: Cada usuario tiene su propio progreso aislado
- **Admin automático**: Email específico se hace admin automáticamente

### ✅ Seguridad
- **Row Level Security**: Políticas de acceso configuradas
- **Validación**: Verificación de credenciales
- **Encriptación**: Listo para hashear contraseñas

## 🐛 Solución de Problemas

### Error de conexión
```bash
# Verifica las variables de entorno
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

### Error al guardar datos
1. Verifica que la tabla `users` existe
2. Revisa las políticas RLS
3. Comprueba la conexión a internet

### Error de políticas RLS
Si ves "Row Level Security enabled but no policies" en Supabase:
1. Ve al **SQL Editor** de Supabase
2. Ejecuta las políticas del archivo `supabase-setup.sql`
3. O copia las políticas específicas para tu tabla desde arriba

### Error "column 'user_id' does not exist"
Si ves este error al ejecutar las políticas RLS:
1. **Verifica la estructura de tu tabla**:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'Space Legacy' AND table_schema = 'public';
```

2. **Identifica el nombre correcto de la columna** que almacena el ID del usuario
3. **Reemplaza `user_id`** en las políticas por el nombre correcto (ej: `id`, `userId`, etc.)

### Error de políticas existentes
Si ves "policy already exists":
1. Ve al **SQL Editor** de Supabase
2. Ejecuta primero estos comandos para eliminar políticas existentes:

```sql
-- Primero verifica qué políticas existen
SELECT polname, polcmd, polroles, polqual, polwithcheck
FROM pg_policy
WHERE schemaname = 'public' AND tablename = 'users';

-- Luego elimina las políticas existentes
DROP POLICY IF EXISTS "Users can read all data" ON users;
DROP POLICY IF EXISTS "Users can insert data" ON users;
DROP POLICY IF EXISTS "Users can update data" ON users;
DROP POLICY IF EXISTS "Users can delete data" ON users;
```

3. Luego ejecuta las políticas nuevas del archivo `supabase-setup.sql`

### Error de SECURITY DEFINER View
Si ves "View is defined with the SECURITY DEFINER property":
1. Ve al **SQL Editor** de Supabase
2. Ejecuta estos comandos para recrear la vista:

```sql
-- Eliminar la vista existente
DROP VIEW IF EXISTS user_profiles;

-- Crear la vista sin SECURITY DEFINER
CREATE OR REPLACE VIEW user_profiles
WITH (security_invoker = on) AS
SELECT
  id,
  username,
  avatar,
  coins,
  is_admin,
  is_special_admin,
  equipped_ship,
  equipped_upgrade,
  equipped_pet,
  unlocked_ships,
  unlocked_upgrades,
  unlocked_pets,
  pet_levels,
  settings,
  created_at,
  updated_at
FROM users;

-- Otorgar permisos
GRANT SELECT ON user_profiles TO anon, authenticated;
```

### Datos no se actualizan
1. Reinicia el servidor de desarrollo
2. Limpia el localStorage del navegador
3. Verifica que las claves de Supabase sean correctas
4. Confirma que las políticas RLS estén configuradas

## 🚀 Próximos Pasos

### Mejoras de Seguridad (Producción)
```sql
-- Hashear contraseñas
-- Políticas RLS más restrictivas
-- Autenticación con email
```

### Funcionalidades Adicionales
- Sistema de amigos
- Estadísticas globales
- Logros y recompensas
- Backup automático

---

¡Tu juego ahora tiene persistencia completa de datos! 🎮✨