import { Err, Ok, Result } from 'ts-results';
import { Coord, SerializedCoord } from './coords';

export const range = (length: number, startAt = 0) =>
  Array.from({ length }, (_, i) => i + startAt);

export const noop = () => {};

export const isDefined = <T>(m: T | undefined): m is T => m !== undefined;

export const identity = <T>(n: T) => n;

export const deserializeCoord = (s: SerializedCoord): Coord => {
  const [row, col] = s.split(',');

  return { row: Number(row), col: Number(col) };
};

export const objectKeys = <O extends object>(o: O) =>
  Object.keys(o) as (keyof O)[];

// type KeysOfType<T, K> = { [P in keyof T]: T[P] extends K ? P : never }[keyof T];

// export const existsIn = <T, R extends KeysOfType<T, R>>(
//   toCheck: T,
//   againstList: KeysOfType<T, R>[]
// ): toCheck is R => true;

export const toDictIndexedBy = <O, KGetter extends (o: O, i: number) => string>(
  list: O[],
  getKey: KGetter
) =>
  list.reduce(
    (prev, next, i) => ({
      ...prev,
      [getKey(next, i)]: next,
    }),
    {} as { [k: string]: O }
  );

export const groupByIndex = <O, KGetter extends (o: O, i: number) => string>(
  list: O[],
  getKey: KGetter
) =>
  list.reduce((prev, next, i) => {
    const key = getKey(next, i);

    return {
      ...prev,
      [key]: [...(prev[key] || []), next],
    };
  }, {} as { [k: string]: O[] });

export const zipArray = <A extends unknown, B extends unknown>(
  a: A[],
  b: B[]
) => a.map((aItem, i) => [aItem, b[i]]);

export const zipArrayAndTrim = <A extends unknown, B extends unknown>(
  a: A[],
  b: B[]
) => a.map((aItem, i) => (b[i] ? [aItem, b[i]] : [aItem]));

/**
 * https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
 *
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
export function getRandomInt(givenMin: number, givenMax: number) {
  const min = Math.ceil(givenMin);
  const max = Math.floor(givenMax);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const invoke = <T>(fn: () => T): T => fn();

export type Asset = {
  type: 'img';
  path: string;
};

export const toImgAsset = (path: string): Asset => ({ type: 'img', path });

export const checkArrayItems = <T>(
  arr: unknown[],
  validatorFn: (i: unknown) => i is T
): Result<T[], void> => {
  const invalid = arr.find((t) => !validatorFn(t));

  if (invalid) {
    return Err.EMPTY;
  }

  return new Ok(arr as T[]);
};

export const checkAllArrayItemsExist = <T>(
  arr: T[]
): Result<NonNullable<T>[], void> => {
  return checkArrayItems(arr, (a): a is NonNullable<T> => !!a);
};
