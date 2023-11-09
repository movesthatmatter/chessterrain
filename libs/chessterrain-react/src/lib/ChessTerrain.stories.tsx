import type { Meta, StoryObj } from '@storybook/react';
import { ChessTerrain } from './ChessTerrain';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta: Meta<typeof ChessTerrain> = {
  component: ChessTerrain,
  title: 'ChessTerrain',
};
export default meta;
type Story = StoryObj<typeof ChessTerrain>;

export const Chess = {
  args: {
    
  },
};

// export const Heading: Story = {
//   args: {},
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement);
//     expect(canvas.getByText(/Welcome to ChessTerrain!/gi)).toBeTruthy();
//   },
// };
