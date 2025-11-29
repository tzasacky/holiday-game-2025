import * as ex from 'excalibur';
import { Level } from '../Level';
import { BiomeDefinition } from '../../data/biomes';

export interface LevelGenerator {
    generate(width: number, height: number, biome: BiomeDefinition, floorNumber?: number): Level;
}
