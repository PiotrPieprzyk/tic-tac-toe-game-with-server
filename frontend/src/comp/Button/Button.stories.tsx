import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Button, type ButtonProps } from '@/comp/Button/Button'

function ButtonWithWidth({ width, ...args }: ButtonProps & { width?: string }) {
  return <Button {...args} style={{ width }} />
}

const meta = {
  component: ButtonWithWidth,
  args: {
    children: 'CONNECT',
    variant: 'primary',
    width: 'auto',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'danger', 'ghost'],
      description: 'Switch between button variants using the Controls panel below.',
    },
    loadingText: {
      control: { type: 'text' },
    },
    width: {
      control: { type: 'text' },
      description: 'Story-only control: CSS width applied to the button (e.g. "auto", "240px", "100%").',
    },
    loading: { control: { type: 'boolean' } }
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof ButtonWithWidth>

export default meta
type Story = StoryObj<typeof meta>

// Use the Controls panel (variant / loading / disabled / width) to try any combination live.
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /connect/i })).toBeVisible()
  },
}