import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { TextField, type TextFieldProps } from '@/comp/TextField/TextField'

function TextFieldWithWidth({ width, ...args }: TextFieldProps & { width?: string }) {
  const [value, setValue] = useState(args.value ?? '')

  return (
    <TextField
      {...args}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      style={{ width }}
    />
  )
}

const meta = {
  component: TextFieldWithWidth,
  args: {
    label: 'ENTER_HANDLE:',
    placeholder: 'enter_value',
    width: '320px',
  },
  argTypes: {
    label: {
      control: { type: 'text' },
    },
    errorMessage: {
      control: { type: 'text' },
    },
    hint: {
      control: { type: 'text' },
    },
    width: {
      control: { type: 'text' },
      description: 'Story-only control: CSS width applied to the field (e.g. "auto", "320px", "100%").',
    },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof TextFieldWithWidth>

export default meta
type Story = StoryObj<typeof meta>

// Use the Controls panel (errorMessage / hint / width) to try any combination live.
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeVisible()
  },
}

export const WithHint: Story = {
  args: {
    hint: '3–20 CHARS · MUST BE UNIQUE',
  },
}

export const WithError: Story = {
  args: {
    value: 'ab',
    errorMessage: 'ERR: VALIDATION_MESSAGE',
  },
}
