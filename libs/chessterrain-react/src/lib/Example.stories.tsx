import type { Meta, StoryObj } from '@storybook/react';
import { Example } from './Example';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta: Meta<typeof Example> = {
  component: Example,
  title: 'Example',
};
export default meta;
type Story = StoryObj<typeof Example>;

export const Primary = {
  args: {
    sizePx: 10,
  },
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Welcome to ChessTerrain!/gi)).toBeTruthy();
  },
};
