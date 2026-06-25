type PickerHandler = (editor: any, position: { x: number; y: number }) => void
let _handler: PickerHandler | null = null

export function registerTablePicker(fn: PickerHandler | null): void {
  _handler = fn
}

export function openTablePicker(editor: any, position: { x: number; y: number }): void {
  _handler?.(editor, position)
}
