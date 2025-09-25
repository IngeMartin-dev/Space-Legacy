"""
Sistema de patrones de movimiento y colisiones para enemigos de Space Invaders
Autor: Sistema de IA
Fecha: 2025

Este archivo contiene los algoritmos para:
1. Patrones de movimiento de enemigos
2. Sistema de colisiones optimizado
3. Formaciones de enemigos por nivel
"""

import math
import time
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class EnemyType(Enum):
    SCOUT = "scout"
    FIGHTER = "fighter"
    CRUISER = "cruiser"
    DESTROYER = "destroyer"
    BATTLESHIP = "battleship"
    MOTHERSHIP = "mothership"

class MovementPattern(Enum):
    HORIZONTAL_WAVES = 0
    VERTICAL_WAVES = 1
    CIRCULAR = 2
    SPIRAL_DESCENT = 3
    GROUP_FORMATION = 4
    ZIGZAG_ADVANCED = 5

@dataclass
class Position:
    x: float
    y: float

@dataclass
class Enemy:
    id: str
    position: Position
    initial_position: Position
    enemy_type: EnemyType
    width: float
    height: float
    health: int
    max_health: int
    speed_x: float
    speed_y: float
    animation_frame: float = 0
    move_offset: float = 0

@dataclass
class CollisionBox:
    x: float
    y: float
    width: float
    height: float

class EnemyPatternSystem:
    """Sistema principal para manejar patrones de movimiento de enemigos"""
    
    def __init__(self, canvas_width: int = 1400, canvas_height: int = 800):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.horizontal_direction = 1
        self.pattern_start_time = time.time()
        
    def get_enemy_formation(self, level: int) -> str:
        """Obtiene la formación de enemigos basada en el nivel"""
        formations = [
            'line', 'v-formation', 'diamond', 'circle', 'spiral',
            'wave', 'cross', 'star', 'heart', 'arrow'
        ]
        return formations[level % len(formations)]
    
    def generate_formation_positions(self, formation: str, rows: int, cols: int, level: int) -> List[Dict]:
        """Genera posiciones para la formación especificada"""
        positions = []
        center_x = self.canvas_width / 2
        center_y = 150
        spacing = 55
        
        if formation == 'line':
            positions = self._generate_line_formation(rows, cols, center_x, center_y, spacing)
        elif formation == 'v-formation':
            positions = self._generate_v_formation(rows, cols, center_x, center_y, spacing)
        elif formation == 'diamond':
            positions = self._generate_diamond_formation(rows, cols, center_x, center_y, spacing)
        elif formation == 'circle':
            positions = self._generate_circle_formation(rows, cols, center_x, center_y, spacing)
        elif formation == 'spiral':
            positions = self._generate_spiral_formation(rows, cols, center_x, center_y)
        elif formation == 'heart':
            positions = self._generate_heart_formation(rows, cols, center_x, center_y)
        else:
            positions = self._generate_line_formation(rows, cols, center_x, center_y, spacing)
            
        return positions
    
    def _generate_line_formation(self, rows: int, cols: int, center_x: float, center_y: float, spacing: float) -> List[Dict]:
        """Genera formación en línea"""
        positions = []
        for r in range(rows):
            for c in range(cols):
                enemy_type = EnemyType.SCOUT if r == 0 else (EnemyType.CRUISER if r == rows - 1 else EnemyType.FIGHTER)
                positions.append({
                    'x': center_x - (cols * spacing) / 2 + c * spacing,
                    'y': center_y + r * spacing,
                    'type': enemy_type.value
                })
        return positions
    
    def _generate_v_formation(self, rows: int, cols: int, center_x: float, center_y: float, spacing: float) -> List[Dict]:
        """Genera formación en V"""
        positions = []
        for r in range(rows):
            row_cols = max(1, cols - r)
            for c in range(row_cols):
                enemy_type = EnemyType.SCOUT if r == 0 else EnemyType.FIGHTER
                positions.append({
                    'x': center_x - (row_cols * spacing) / 2 + c * spacing,
                    'y': center_y + r * spacing,
                    'type': enemy_type.value
                })
        return positions
    
    def _generate_diamond_formation(self, rows: int, cols: int, center_x: float, center_y: float, spacing: float) -> List[Dict]:
        """Genera formación en diamante"""
        positions = []
        mid_row = rows // 2
        for r in range(rows):
            row_width = r + 1 if r <= mid_row else rows - r
            for c in range(row_width):
                enemy_type = EnemyType.SCOUT if r == 0 or r == rows - 1 else EnemyType.FIGHTER
                positions.append({
                    'x': center_x - (row_width * spacing) / 2 + c * spacing,
                    'y': center_y + r * spacing * 0.8,  # Más compacto
                    'type': enemy_type.value
                })
        return positions
    
    def _generate_circle_formation(self, rows: int, cols: int, center_x: float, center_y: float, spacing: float) -> List[Dict]:
        """Genera formación circular"""
        positions = []
        radius = min(cols, rows) * spacing / 3  # Más pequeño
        total_enemies = rows * cols
        for i in range(total_enemies):
            angle = (i / total_enemies) * math.pi * 2
            enemy_type = EnemyType.SCOUT if i % 3 == 0 else EnemyType.FIGHTER
            positions.append({
                'x': center_x + math.cos(angle) * radius,
                'y': center_y + math.sin(angle) * radius,
                'type': enemy_type.value
            })
        return positions
    
    def _generate_spiral_formation(self, rows: int, cols: int, center_x: float, center_y: float) -> List[Dict]:
        """Genera formación en espiral"""
        positions = []
        spiral_radius = 10  # Más pequeño
        angle = 0
        for i in range(rows * cols):
            enemy_type = EnemyType.CRUISER if i % 4 == 0 else EnemyType.FIGHTER
            positions.append({
                'x': center_x + math.cos(angle) * spiral_radius,
                'y': center_y + math.sin(angle) * spiral_radius,
                'type': enemy_type.value
            })
            angle += 0.3  # Más lento
            spiral_radius += 2.0  # Menos espacio
        return positions
    
    def _generate_heart_formation(self, rows: int, cols: int, center_x: float, center_y: float) -> List[Dict]:
        """Genera formación en corazón"""
        positions = []
        total_enemies = rows * cols
        for i in range(total_enemies):
            t = (i / total_enemies) * math.pi * 2
            heart_x = 16 * math.pow(math.sin(t), 3)
            heart_y = -(13 * math.cos(t) - 5 * math.cos(2*t) - 2 * math.cos(3*t) - math.cos(4*t))
            positions.append({
                'x': center_x + heart_x * 2.0,  # Más pequeño
                'y': center_y + heart_y * 2.0,  # Más pequeño
                'type': EnemyType.FIGHTER.value
            })
        return positions
    
    def update_enemy_position(self, enemy: Enemy, pattern: MovementPattern, level: int, delta_time: float) -> Position:
        """Actualiza la posición del enemigo basado en el patrón de movimiento"""
        current_time = time.time() - self.pattern_start_time
        wave_amplitude = 70 + level * 6
        wave_frequency = 0.5 + level * 0.03
        speed_multiplier = 1 + (level - 1) * 0.1
        
        new_x = enemy.position.x
        new_y = enemy.position.y
        
        # Ajustar frecuencia para movimientos más visibles
        adjusted_frequency = wave_frequency * 1.5
        
        if pattern == MovementPattern.HORIZONTAL_WAVES:
            wave_x = math.sin(current_time * adjusted_frequency * 0.7 + len(enemy.id) * 0.1) * wave_amplitude * 0.8  # Más lento y menos amplio
            wave_y = math.sin(current_time * 0.2) * 15  # Más lento
            new_x = enemy.initial_position.x + wave_x
            new_y = enemy.initial_position.y + wave_y
            
        elif pattern == MovementPattern.VERTICAL_WAVES:
            vert_wave_x = math.sin(current_time * 0.3) * 20  # Más lento y menos amplio
            vert_wave_y = math.sin(current_time * adjusted_frequency * 0.8 + len(enemy.id) * 0.2) * wave_amplitude * 0.4  # Más lento y menos amplio
            new_x = enemy.initial_position.x + vert_wave_x
            new_y = enemy.initial_position.y + vert_wave_y
            
        elif pattern == MovementPattern.CIRCULAR:
            radius = 30 + level * 2  # Más pequeño
            circle_x = math.cos(current_time * adjusted_frequency * 0.5 + len(enemy.id) * 0.1) * radius  # Más lento
            circle_y = math.sin(current_time * adjusted_frequency * 0.5 + len(enemy.id) * 0.1) * radius * 0.3  # Más lento
            new_x = enemy.initial_position.x + circle_x
            new_y = enemy.initial_position.y + circle_y
            
        elif pattern == MovementPattern.SPIRAL_DESCENT:
            spiral_x = math.sin(current_time * adjusted_frequency * 1.5 + len(enemy.id) * 0.4) * wave_amplitude * 1.2
            spiral_y = (current_time * speed_multiplier * 10) % (self.canvas_height * 0.5)  # Más lento
            new_x = enemy.initial_position.x + spiral_x
            new_y = enemy.initial_position.y + spiral_y
            
        elif pattern == MovementPattern.GROUP_FORMATION:
            group_speed = speed_multiplier * 60  # Más lento
            enemy.move_offset += self.horizontal_direction * group_speed * delta_time
            if enemy.move_offset > self.canvas_width * 0.3 or enemy.move_offset < -self.canvas_width * 0.3:
                self.horizontal_direction *= -1
            group_y = math.sin(current_time * 0.3) * 10  # Más lento
            new_x = enemy.initial_position.x + enemy.move_offset
            new_y = enemy.initial_position.y + group_y
            
        elif pattern == MovementPattern.ZIGZAG_ADVANCED:
            zigzag_speed = speed_multiplier * 50  # Más lento
            zigzag_pattern = math.sin(current_time * 1.5 + len(enemy.id) * 0.3) * zigzag_speed * delta_time  # Más lento
            zigzag_y = abs(math.sin(current_time * 0.5)) * 15  # Más lento
            new_x = enemy.initial_position.x + zigzag_pattern
            new_y = enemy.initial_position.y + zigzag_y
        
        # Validar límites del canvas
        new_x = max(0, min(self.canvas_width - enemy.width, new_x))
        new_y = max(0, min(self.canvas_height, new_y))
        
        # Actualizar posición del enemigo
        enemy.position.x = new_x
        enemy.position.y = new_y
        
        return Position(new_x, new_y)

class CollisionSystem:
    """Sistema optimizado de detección de colisiones"""
    
    @staticmethod
    def check_collision(box1: CollisionBox, box2: CollisionBox) -> bool:
        """Verifica colisión entre dos cajas de colisión usando AABB"""
        return (box1.x < box2.x + box2.width and
                box1.x + box1.width > box2.x and
                box1.y < box2.y + box2.height and
                box1.y + box1.height > box2.y)
    
    @staticmethod
    def check_circle_collision(pos1: Position, radius1: float, pos2: Position, radius2: float) -> bool:
        """Verifica colisión circular (más precisa para objetos redondos)"""
        distance_squared = (pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2
        radius_sum_squared = (radius1 + radius2) ** 2
        return distance_squared <= radius_sum_squared
    
    @staticmethod
    def get_collision_box(enemy: Enemy) -> CollisionBox:
        """Obtiene la caja de colisión de un enemigo"""
        # Reducir aún más la caja de colisión para colisiones más precisas
        padding = 1
        return CollisionBox(
            x=enemy.position.x + padding,
            y=enemy.position.y + padding,
            width=enemy.width - padding * 2,
            height=enemy.height - padding * 2
        )
    
    @staticmethod
    def optimize_collision_detection(enemies: List[Enemy], bullets: List[Dict]) -> List[Tuple[str, str]]:
        """Optimiza la detección de colisiones usando spatial partitioning"""
        collisions = []
        
        # Crear grid espacial para optimización
        grid_size = 100
        grid = {}
        
        # Colocar enemigos en el grid
        for enemy in enemies:
            grid_x = int(enemy.position.x // grid_size)
            grid_y = int(enemy.position.y // grid_size)
            grid_key = (grid_x, grid_y)
            
            if grid_key not in grid:
                grid[grid_key] = {'enemies': [], 'bullets': []}
            grid[grid_key]['enemies'].append(enemy)
        
        # Colocar balas en el grid
        for bullet in bullets:
            grid_x = int(bullet['x'] // grid_size)
            grid_y = int(bullet['y'] // grid_size)
            grid_key = (grid_x, grid_y)
            
            if grid_key not in grid:
                grid[grid_key] = {'enemies': [], 'bullets': []}
            grid[grid_key]['bullets'].append(bullet)
        
        # Verificar colisiones solo en celdas que contienen ambos tipos
        for grid_key, cell in grid.items():
            for enemy in cell['enemies']:
                enemy_box = CollisionSystem.get_collision_box(enemy)
                for bullet in cell['bullets']:
                    bullet_box = CollisionBox(bullet['x'], bullet['y'], bullet['width'], bullet['height'])
                    if CollisionSystem.check_collision(enemy_box, bullet_box):
                        collisions.append((enemy.id, bullet['id']))
        
        return collisions

class EnemyAI:
    """Sistema de IA para comportamiento de enemigos"""
    
    def __init__(self):
        self.last_shoot_time = {}
        self.aggression_level = 1.0
    
    def should_enemy_shoot(self, enemy: Enemy, level: int, current_time: float) -> bool:
        """Determina si un enemigo debe disparar"""
        base_shoot_delay = max(2000, 3500 - level * 80)  # Más lento
        difficulty_multiplier = 1 + (level - 1) * 0.02  # Menos agresivo
        shoot_delay = base_shoot_delay / difficulty_multiplier
        
        last_shoot = self.last_shoot_time.get(enemy.id, 0)
        if current_time - last_shoot > shoot_delay:
            # Probabilidad de disparo basada en tipo de enemigo y nivel
            shoot_probability = {
                EnemyType.SCOUT: 0.05 + level * 0.003,  # Menos probable
                EnemyType.FIGHTER: 0.1 + level * 0.003,  # Menos probable
                EnemyType.CRUISER: 0.15 + level * 0.003,  # Menos probable
                EnemyType.DESTROYER: 0.2 + level * 0.003,  # Menos probable
                EnemyType.BATTLESHIP: 0.25 + level * 0.003,  # Menos probable
                EnemyType.MOTHERSHIP: 0.3 + level * 0.003  # Menos probable
            }
            
            enemy_type = EnemyType(enemy.enemy_type)
            if enemy_type in shoot_probability:
                should_shoot = __import__('random').random() < shoot_probability[enemy_type]
                if should_shoot:
                    self.last_shoot_time[enemy.id] = current_time
                return should_shoot
        
        return False
    
    def get_bullet_trajectory(self, enemy: Enemy, target_position: Optional[Position] = None) -> Dict:
        """Calcula la trayectoria de la bala del enemigo"""
        bullet_speed = 200 + __import__('random').randint(-30, 30)  # Más lento
        
        # Si hay un objetivo, apuntar hacia él
        if target_position:
            dx = target_position.x - enemy.position.x
            dy = target_position.y - enemy.position.y
            distance = math.sqrt(dx*dx + dy*dy)
            
            if distance > 0:
                velocity_x = (dx / distance) * bullet_speed * 0.2  # Menos predicción
                velocity_y = bullet_speed
            else:
                velocity_x = 0
                velocity_y = bullet_speed
        else:
            velocity_x = 0
            velocity_y = bullet_speed
        
        return {
            'x': enemy.position.x + enemy.width / 2 - 3,
            'y': enemy.position.y + enemy.height,
            'width': 6,
            'height': 15,
            'velocity_x': velocity_x,
            'velocity_y': velocity_y,
            'damage': 1,
            'is_enemy': True
        }

# Ejemplo de uso del sistema
def main():
    """Función principal de demostración"""
    print("🎮 Sistema de Patrones de Enemigos - Space Invaders")
    print("=" * 50)
    
    # Inicializar sistemas
    pattern_system = EnemyPatternSystem()
    collision_system = CollisionSystem()
    enemy_ai = EnemyAI()
    
    # Generar formación de enemigos para nivel 5
    level = 5
    formation = pattern_system.get_enemy_formation(level)
    positions = pattern_system.generate_formation_positions(formation, 4, 8, level)
    
    print(f"Nivel: {level}")
    print(f"Formación: {formation}")
    print(f"Enemigos generados: {len(positions)}")
    
    # Crear enemigos de ejemplo
    enemies = []
    for i, pos in enumerate(positions[:5]):  # Solo primeros 5 para demo
        enemy = Enemy(
            id=f"enemy_{i}",
            position=Position(pos['x'], pos['y']),
            initial_position=Position(pos['x'], pos['y']),
            enemy_type=EnemyType(pos['type']),
            width=40,
            height=40,
            health=2,
            max_health=2,
            speed_x=3,
            speed_y=1.5
        )
        enemies.append(enemy)
    
    # Simular actualización de posiciones
    print("\n🎯 Simulando movimiento de enemigos:")
    for pattern in MovementPattern:
        print(f"\nPatrón: {pattern.name}")
        for enemy in enemies[:2]:  # Solo primeros 2 para demo
            new_pos = pattern_system.update_enemy_position(
                enemy, pattern, level, 0.016  # 60 FPS
            )
            print(f"  Enemigo {enemy.id}: ({new_pos.x:.1f}, {new_pos.y:.1f})")
    
    print("\n✅ Sistema de patrones funcionando correctamente!")

if __name__ == "__main__":
    main()