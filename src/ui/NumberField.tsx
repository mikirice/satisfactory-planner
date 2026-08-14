import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef, Ref } from 'react'

const COMPLETE_NUMBER = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/

function normalizeNumberText(text: string): string {
  return text
    .replace(/[\uff10-\uff19]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/\uff0e/g, '.')
    .replace(/[\uff0d\u30fc\u2010]/g, '-')
    .replace(/[\s,\uff0c]/g, '')
}

function parseNumberText(text: string): number | null {
  if (!COMPLETE_NUMBER.test(text)) return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

function parseNumberAttribute(value: string | number | undefined): number | null {
  if (value === undefined || (typeof value === 'string' && value.trim() === '')) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatValue(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}

type SubmittedValue = { text: string; value: number } | null

export type NumberFieldProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  | 'type'
  | 'inputMode'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onBlur'
  | 'onFocus'
  | 'onClick'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onKeyDown'
  | 'onKeyPress'
  | 'onCompositionStart'
  | 'onCompositionEnd'
  | 'onPaste'
> & {
  ref?: Ref<HTMLInputElement>
  value: number | null | undefined
  onValueChange: (value: number) => void
  /** 空欄を値として扱う入力（原料上限）だけが使う。blur 時に一度だけ呼ぶ。 */
  onEmpty?: () => void
}

/**
 * 全角数字と IME 編集を扱える、数値用のテキスト入力。
 *
 * type="number" は全角文字を React に届く前に捨てるため、表示値はローカルに保持し、
 * 完成した有限数だけを呼び出し側へ渡す。min / max / step は入力の契約として DOM に残す。
 */
export function NumberField({
  ref,
  value,
  onValueChange,
  onEmpty,
  ...inputProps
}: NumberFieldProps) {
  const [rawValue, setRawValue] = useState(() => formatValue(value))
  const composing = useRef(false)
  const dirty = useRef(false)
  const valueRef = useRef(value)
  const steppedInput = useRef<HTMLInputElement>(null)
  const selectOnMouseUp = useRef(false)
  const lastSubmitted = useRef<SubmittedValue>(
    typeof value === 'number' ? { text: formatValue(value), value } : null,
  )

  valueRef.current = value

  // 保存プランの読込など、入力欄の外から値が変わった場合も表示を同期する。
  useEffect(() => {
    const text = formatValue(value)
    setRawValue(text)
    lastSubmitted.current = typeof value === 'number' ? { text, value } : null
  }, [value])

  // controlled value の反映で再描画されても、step 後の全選択を維持する。
  useLayoutEffect(() => {
    steppedInput.current?.select()
  })

  const applyText = (text: string): void => {
    const normalized = normalizeNumberText(text)
    setRawValue(normalized)

    const parsed = parseNumberText(normalized)
    if (parsed === null) return

    const submitted = lastSubmitted.current
    if (submitted?.text === normalized && Object.is(submitted.value, parsed)) return
    lastSubmitted.current = { text: normalized, value: parsed }
    onValueChange(parsed)
  }

  return (
    <input
      {...inputProps}
      ref={ref}
      type="text"
      inputMode="decimal"
      value={rawValue}
      onChange={(event) => {
        steppedInput.current = null
        dirty.current = true
        if (composing.current) {
          setRawValue(event.currentTarget.value)
          return
        }
        applyText(event.currentTarget.value)
      }}
      onCompositionStart={() => {
        steppedInput.current = null
        composing.current = true
      }}
      onCompositionEnd={(event) => {
        steppedInput.current = null
        composing.current = false
        dirty.current = true
        applyText(event.currentTarget.value)
      }}
      onPaste={(event) => {
        steppedInput.current = null
        const pasted = event.clipboardData.getData('text')
        if (pasted === '') return

        event.preventDefault()
        dirty.current = true
        const input = event.currentTarget
        const start = input.selectionStart ?? input.value.length
        const end = input.selectionEnd ?? start
        applyText(`${input.value.slice(0, start)}${pasted}${input.value.slice(end)}`)
      }}
      onBlur={(event) => {
        steppedInput.current = null
        composing.current = false
        const normalized = normalizeNumberText(event.currentTarget.value)
        const parsed = parseNumberText(normalized)

        if (parsed !== null) {
          applyText(normalized)
          // store 側で丸め・clamp されて同じ prop 値に戻った場合も、確定表示へ戻す。
          const committed = valueRef.current
          const text = formatValue(committed)
          setRawValue(text)
          lastSubmitted.current =
            typeof committed === 'number' ? { text, value: committed } : null
        } else if (normalized === '' && onEmpty !== undefined && dirty.current) {
          onEmpty()
          setRawValue('')
          lastSubmitted.current = null
        } else {
          const committed = valueRef.current
          const text = formatValue(committed)
          setRawValue(text)
          lastSubmitted.current =
            typeof committed === 'number' ? { text, value: committed } : null
        }
        dirty.current = false
      }}
      onFocus={(event) => event.currentTarget.select()}
      onMouseDown={(event) => {
        selectOnMouseUp.current = document.activeElement !== event.currentTarget
      }}
      onMouseUp={(event) => {
        const shouldSelect = selectOnMouseUp.current
        selectOnMouseUp.current = false
        if (!shouldSelect) return

        event.preventDefault()
        event.currentTarget.select()
      }}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
          steppedInput.current = null
          return
        }

        if (composing.current) return
        event.preventDefault()

        const parsed = parseNumberText(normalizeNumberText(event.currentTarget.value))
        const committed = valueRef.current
        const base =
          parsed ??
          (typeof committed === 'number' && Number.isFinite(committed) ? committed : null)
        if (base === null) return

        const configuredStep = parseNumberAttribute(inputProps.step)
        const step = configuredStep !== null && configuredStep > 0 ? configuredStep : 1
        const delta = step * (event.shiftKey ? 10 : 1)
        const min = parseNumberAttribute(inputProps.min) ?? -Infinity
        const max = parseNumberAttribute(inputProps.max) ?? Infinity
        const stepped = base + (event.key === 'ArrowUp' ? delta : -delta)
        const next = Math.min(max, Math.max(min, stepped))
        if (!Number.isFinite(next)) return

        const input = event.currentTarget
        steppedInput.current = input
        dirty.current = true
        applyText(formatValue(next))
        input.select()
      }}
      onKeyPress={(event) => event.stopPropagation()}
    />
  )
}
