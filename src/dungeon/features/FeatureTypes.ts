import { TerrainType } from '../../data/terrain';

export enum FeatureMorphology {
  Linear = 'linear',
  Patch = 'patch',
  Blob = 'blob'
}

export interface FeatureConfig {
  morphology: FeatureMorphology;
  terrainType: TerrainType;
  probability: number;
  properties?: Record<string, any>;
  placement?: 'any' | 'room' | 'corridor'; // Constraint for feature placement
}
