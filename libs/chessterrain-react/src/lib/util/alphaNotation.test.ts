import { coordToAlphaNotation } from './alphaNotation';

describe('coordToAlphaNotation', () => {
  test('correct coords', () => {
    expect(coordToAlphaNotation({ col: 0, row: 0 })).toBe('a8');
    expect(coordToAlphaNotation({ col: 7, row: 0 })).toBe('h8');
    expect(coordToAlphaNotation({ col: 7, row: 7 })).toBe('h1');
    expect(coordToAlphaNotation({ col: 0, row: 7 })).toBe('a1');

    expect(coordToAlphaNotation({ col: 3, row: 4 })).toBe('d4');
    expect(coordToAlphaNotation({ col: 4, row: 4 })).toBe('e4');
    expect(coordToAlphaNotation({ col: 5, row: 5 })).toBe('f3');
    expect(coordToAlphaNotation({ col: 1, row: 3 })).toBe('b5');
    expect(coordToAlphaNotation({ col: 2, row: 6 })).toBe('c2');
  });
});
