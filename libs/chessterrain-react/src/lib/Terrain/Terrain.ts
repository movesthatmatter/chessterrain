import { range } from '../util-kit';
import { TerrainConfigurator, TerrainState } from './types';

export class Terrain {
  state: TerrainState;

  constructor(
    p:
      | {
          load: true;
          state: TerrainState;
          props?: undefined;
        }
      | {
          load?: false;
          props: TerrainConfigurator;
          state?: undefined;
        }
  ) {
    if (p.load) {
      this.state = p.state;

      return;
    }

    const { props } = p;

    const height = props.height || props.width;

    this.state = range(height).map((row) =>
      range(props.width).map((col) => ((row + col) % 2 ? 'b' : 'w'))
    );
  }
}
