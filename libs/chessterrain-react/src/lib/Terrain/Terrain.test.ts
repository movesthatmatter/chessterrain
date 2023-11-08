import { Terrain } from './Terrain';

test('renders matrix of 2', () => {
  const actual = new Terrain({ props: { width: 2 } }).state;
  const expected = [
    ['w', 'b'],
    ['b', 'w'],
  ];

  expect(actual).toEqual(expected);
});

test('renders matrix of 8', () => {
  const actual = new Terrain({ props: { width: 8 } }).state;
  const expected = [
    ['w', 'b', 'w', 'b', 'w', 'b', 'w', 'b'],
    ['b', 'w', 'b', 'w', 'b', 'w', 'b', 'w'],
    ['w', 'b', 'w', 'b', 'w', 'b', 'w', 'b'],
    ['b', 'w', 'b', 'w', 'b', 'w', 'b', 'w'],
    ['w', 'b', 'w', 'b', 'w', 'b', 'w', 'b'],
    ['b', 'w', 'b', 'w', 'b', 'w', 'b', 'w'],
    ['w', 'b', 'w', 'b', 'w', 'b', 'w', 'b'],
    ['b', 'w', 'b', 'w', 'b', 'w', 'b', 'w'],
  ];

  expect(actual).toEqual(expected);
});
