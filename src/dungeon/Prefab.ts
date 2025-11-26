import { TerrainType } from './Terrain';

export interface Prefab {
    name: string;
    width: number;
    height: number;
    layout: string[];
    legend: Record<string, TerrainType>;
}

export const Prefabs: Prefab[] = [
    {
        name: "Small Shrine",
        width: 5,
        height: 5,
        layout: [
            "#####",
            "#...#",
            "#.F.#",
            "#...#",
            "#####"
        ],
        legend: {
            '#': TerrainType.Wall,
            '.': TerrainType.Floor,
            'F': TerrainType.Fireplace
        }
    },
    {
        name: "Storage Room",
        width: 6,
        height: 4,
        layout: [
            "######",
            "#D..D#",
            "#....#",
            "######"
        ],
        legend: {
            '#': TerrainType.Wall,
            '.': TerrainType.Floor,
            'D': TerrainType.Decoration
        }
    },
    {
        name: "Shop",
        width: 7,
        height: 5,
        layout: [
            "#######",
            "#.....#",
            "#.M...#",
            "#.....#",
            "#######"
        ],
        legend: {
            '#': TerrainType.Wall,
            '.': TerrainType.Floor,
            'M': TerrainType.Floor // Merchant spot (handled by special logic or just floor for now)
        }
    }
];
