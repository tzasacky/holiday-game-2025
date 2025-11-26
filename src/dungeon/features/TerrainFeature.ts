import { Level } from '../Level';
import { Biome } from '../Biome';
import { GenerationContext } from '../generators/GenerationContext';

export abstract class TerrainFeature {
    abstract apply(context: GenerationContext): void;
}
