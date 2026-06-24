interface MenuAction {
  label: string
  shortcut?: string
  action?: () => void
  disabled?: boolean
  separator?: boolean
}

interface MenuBarProps {
  title: string
  modified: boolean
  updateStatus: { status: string; version?: string; percent?: number } | null
  onDownloadUpdate: () => void
  onInstallUpdate: () => void
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
  onExportHtml: () => void
  onExportPdf: () => void
  onQuit: () => void
  onUndo: () => void
  onRedo: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onSearch: () => void
  onThemeLight: () => void
  onThemeDark: () => void
  onFocusMode: () => void
  onFullscreen: () => void
  onToggleOutline: () => void
  onSettings: () => void
  onStats: () => void
  onCommandPalette: () => void
  onShowOnboarding: () => void
  focusMode: boolean
  showOutline: boolean
}

function MenuDropdown({ label, items }: { label: string; items: MenuAction[] }) {
  return (
    <div className="menubar-item">
      <button className="menubar-btn">{label}</button>
      <div className="menubar-dropdown">
        {items.map((item, i) =>
          item.separator ? (
            <div key={i} className="menu-sep" />
          ) : (
            <button
              key={i}
              className="menubar-dropdown-item"
              onClick={item.action}
              disabled={item.disabled}
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="menubar-shortcut">{item.shortcut}</span>}
            </button>
          )
        )}
      </div>
    </div>
  )
}

export function MenuBar(props: MenuBarProps) {
  const { title, modified, updateStatus, onDownloadUpdate, onInstallUpdate } = props
  const archivo: MenuAction[] = [
    { label: 'Nuevo', shortcut: 'Ctrl+N', action: props.onNew },
    { label: 'Abrir', shortcut: 'Ctrl+O', action: props.onOpen },
    { separator: true, label: '' },
    { label: 'Guardar', shortcut: 'Ctrl+S', action: props.onSave },
    { label: 'Guardar Como', shortcut: 'Ctrl+Shift+S', action: props.onSaveAs },
    { separator: true, label: '' },
    { label: 'Exportar HTML', action: props.onExportHtml },
    { label: 'Exportar PDF', action: props.onExportPdf },
    { separator: true, label: '' },
    { label: 'Configuración', action: props.onSettings },
    { separator: true, label: '' },
    { label: 'Salir', shortcut: 'Alt+F4', action: props.onQuit }
  ]

  const editar: MenuAction[] = [
    { label: 'Deshacer', shortcut: 'Ctrl+Z', action: props.onUndo },
    { label: 'Rehacer', shortcut: 'Ctrl+Y', action: props.onRedo },
    { separator: true, label: '' },
    { label: 'Cortar', shortcut: 'Ctrl+X', action: props.onCut },
    { label: 'Copiar', shortcut: 'Ctrl+C', action: props.onCopy },
    { label: 'Pegar', shortcut: 'Ctrl+V', action: props.onPaste },
    { separator: true, label: '' },
    { label: 'Buscar', shortcut: 'Ctrl+F', action: props.onSearch },
    { label: 'Reemplazar', shortcut: 'Ctrl+H', action: props.onSearch }
  ]

  const ver: MenuAction[] = [
    { label: 'Tema Claro', action: props.onThemeLight },
    { label: 'Tema Oscuro', action: props.onThemeDark },
    { separator: true, label: '' },
    { label: props.focusMode ? 'Salir Modo Enfoque' : 'Modo Enfoque', action: props.onFocusMode },
    { label: 'Pantalla Completa', shortcut: 'F11', action: props.onFullscreen },
    { separator: true, label: '' },
    { label: props.showOutline ? 'Ocultar Índice' : 'Mostrar Índice', action: props.onToggleOutline },
    { separator: true, label: '' },
    { label: 'Estadísticas', action: props.onStats }
  ]

  const ayuda: MenuAction[] = [
    { label: 'Paleta de Comandos', shortcut: 'Ctrl+Shift+P', action: props.onCommandPalette },
    { separator: true, label: '' },
    { label: 'Ver guía nuevamente', action: props.onShowOnboarding }
  ]

  return (
    <nav className="menubar">
      <div className="menubar-title">{title}{modified ? ' ●' : ''}</div>
      <MenuDropdown label="Archivo" items={archivo} />
      <MenuDropdown label="Editar" items={editar} />
      <MenuDropdown label="Ver" items={ver} />
      <MenuDropdown label="Ayuda" items={ayuda} />
      <div className="menubar-spacer" />
      {updateStatus?.status === 'available' && (
        <button className="menubar-update-btn" onClick={onDownloadUpdate} title={`Descargar ${updateStatus.version}`}>
          ⬇ Descargar {updateStatus.version}
        </button>
      )}
      {updateStatus?.status === 'downloading' && (
        <button className="menubar-update-btn" disabled>
          ⬇ {Math.round(updateStatus.percent ?? 0)}%
        </button>
      )}
      {updateStatus?.status === 'downloaded' && (
        <button className="menubar-update-btn" onClick={onInstallUpdate} title="Reiniciar para instalar">
          🔄 Reiniciar
        </button>
      )}
    </nav>
  )
}
