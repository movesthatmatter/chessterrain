import { css, CSSInterpolation, keyframes } from '@emotion/css';
import { Emotion } from '@emotion/css/types/create-instance';
import { objectKeys } from './misc';


// TODO: Not sure if this should be done with emotion so might need to get out
export const makeStyles = <T extends Record<string, CSSInterpolation>>(
  styleObjects: T
) =>
  objectKeys(styleObjects).reduce(
    (accum, key) => ({
      ...accum,
      [key]: css(styleObjects[key]),
    }),
    {} as Record<keyof T, ReturnType<Emotion['css']>>
  );

export const makeStyle = (style: CSSInterpolation) => css(style);

export const makeKeyframes = keyframes;
