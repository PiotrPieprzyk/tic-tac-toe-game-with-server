import { useState, type FocusEvent, type InputHTMLAttributes, type ReactNode } from 'react'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label?: ReactNode
  errorMessage?: ReactNode
  hint?: ReactNode
  'data-testid'?: string
}

export function TextField({
  label,
  errorMessage,
  hint,
  className,
  value,
  placeholder,
  onFocus,
  onBlur,
  'data-testid': dataTestId,
  ...rest
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasError = Boolean(errorMessage)
  const hasValue = value !== undefined && value !== null && value !== ''

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setIsFocused(true)
    onFocus?.(event)
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setIsFocused(false)
    onBlur?.(event)
  }

  return (
    <div data-testid={dataTestId}>
      {label ? <label className="mb-2 block font-mono text-body text-text-muted">{label}</label> : null}
      <div
        className={[
          'relative flex items-center border bg-input-background p-3',
          hasError
            ? 'border-danger bg-danger-background shadow-[0_0_10px_rgb(255_45_107/0.25)]'
            : 'border-primary',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          data-testid="input"
          value={value}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent p-3 font-mono text-body text-transparent caret-transparent outline-none"
          {...rest}
        />
        <div aria-hidden="true" className="pointer-events-none flex min-h-[18px] items-center font-mono text-body">
          {hasValue ? (
            <span className={hasError ? 'text-danger-text' : 'text-primary'}>{value}</span>
          ) : !isFocused ? (
            <span className="text-text-faint">{placeholder}</span>
          ) : null}
          {isFocused ? (
            <span
              className={['ml-0.5 h-4 w-2 shrink-0 animate-blink-cursor', hasError ? 'bg-danger' : 'bg-primary'].join(
                ' ',
              )}
            />
          ) : null}
        </div>
      </div>
      {hasError ? (
        <div data-testid="errorMessage" className="mt-1.5 font-mono text-meta text-danger">
          {errorMessage}
        </div>
      ) : hint ? (
        <div className="mt-1.5 font-mono text-meta text-text-faint">{hint}</div>
      ) : null}
    </div>
  )
}
