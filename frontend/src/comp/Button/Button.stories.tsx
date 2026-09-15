import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Button } from '@/comp/Button/Button'

const meta = {
  component: Button,
  args: {
    children: 'Connect',
    variant: 'primary',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'danger', 'ghost'],
      description: 'Switch between button variants using the Controls panel below.',
    },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Use the Controls panel (variant / loading / disabled) to try any combination live.
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /connect/i })).toBeVisible()
  },
}