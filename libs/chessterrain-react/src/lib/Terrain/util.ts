import { TerrainConfigurator, TerrainState } from './types';

export const terrainStateToTerrainConfigurator = (
  ts: TerrainState
): TerrainConfigurator => {
  const height = ts.length;
  const width = ts[0]?.length || height;

  return { width, height };
};
