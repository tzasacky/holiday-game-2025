import { Level } from '../Level';
import { BiomeDefinition } from '../../data/biomes';
import * as ex from 'excalibur';
import { FeatureConfig } from './FeatureTypes';

export interface FeatureContext {
  level: Level;
  rng: ex.Random;
  biome: BiomeDefinition;
}

export interface FeatureGenerator {
  apply(context: FeatureContext, config: FeatureConfig): void;
}
