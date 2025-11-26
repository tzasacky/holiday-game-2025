import { Level } from './Level';
import { Biome } from './Biome';

export interface LevelGenerator {
    generate(width: number, height: number, biome: Biome, scene: ex.Scene): Level;
}
