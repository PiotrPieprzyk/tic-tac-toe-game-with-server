import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { TerminalCard, type TerminalCardProps } from '@/comp/TerminalCard/TerminalCard'

function TerminalCardWithWidth({ width, ...args }: TerminalCardProps & { width?: string }) {
  return <TerminalCard {...args} style={{ width }} />
}

const meta = {
  component: TerminalCardWithWidth,
  args: {
    titleBarLabel: 'guest_session.sh',
    children: <div className="p-6 font-mono text-body text-text-primary">CONTENT</div>,
    width: '390px',
  },
  argTypes: {
    titleBarLabel: {
      control: { type: 'text' },
    },
    width: {
      control: { type: 'text' },
      description: 'Story-only control: CSS width applied to the card (e.g. "auto", "390px", "100%").',
    },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof TerminalCardWithWidth>

export default meta
type Story = StoryObj<typeof meta>

// Use the Controls panel (titleBarLabel / width) to try any combination live.
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('CONTENT')).toBeVisible()
  },
}
