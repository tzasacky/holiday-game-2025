export enum SpawnTableID {
  EarlyFloors = 'early_floors',
  MidFloors = 'mid_floors',
  LateFloors = 'late_floors',
  BossSpawns = 'boss_spawns',
  EliteSpawns = 'elite_spawns',
  HolidayCreatures = 'holiday_creatures',
  IceCreatures = 'ice_creatures', // Mentioned in biomes.ts but not in spawnTables.ts yet, adding for safety
  CorruptedCreatures = 'corrupted_creatures' // Mentioned in biomes.ts
}
