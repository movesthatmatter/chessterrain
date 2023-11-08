import { render } from '@testing-library/react';

import ChessterrainReact from './chessterrain-react';

describe('ChessterrainReact', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChessterrainReact />);
    expect(baseElement).toBeTruthy();
  });
});
