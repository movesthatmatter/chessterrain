import { TerrainConfigurator, TerrainState } from './types';

export const terrainStateToTerrainConfigurator = ({
  length: width,
  [0]: row,
}: TerrainState): TerrainConfigurator => ({
  width,
  height: row?.length || width,
});
