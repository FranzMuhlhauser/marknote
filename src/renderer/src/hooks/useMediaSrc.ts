import { useCallback, useEffect, useRef, useState } from 'react'
import { getCurrentDocDir } from '../utils/currentDoc'

export type MediaSrcState = 'native' | 'loading' | 'ok' | 'missing'

// Evento global para reintentar la resolución de medios rotos (se dispara tras
// guardar, por si el guardado recreó algún archivo).
export const MEDIA_RETRY_EVENT = 'marknote:media-retry'

// Resuelve qué mostrar para un src de imagen/video del editor. Los src
// data:/blob:/http(s) cargan solos ('native'); las rutas locales (relativas
// al .md o absolutas) se resuelven vía IPC a una data URL solo para
// visualizarlas — el atributo src del nodo conserva siempre la ruta original.
// Si readMedia devuelve null el archivo no existe: estado 'missing', que
// habilita el placeholder con Reemplazar/Reintentar. Antes este intento era
// único por cambio de src y un fallo dejaba el nodo roto para siempre.
export function useResolvedMediaSrc(src: string, isLocalPath: boolean): {
  status: MediaSrcState
  dataUrl: string | null
  retry: () => void
} {
  const [status, setStatus] = useState<MediaSrcState>(isLocalPath ? 'loading' : 'native')
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [retryTick, setRetryTick] = useState(0)
  const statusRef = useRef(status)

  useEffect(() => { statusRef.current = status }, [status])

  useEffect(() => {
    if (!isLocalPath) {
      setStatus('native')
      setDataUrl(null)
      return
    }
    let cancelled = false
    setStatus('loading')
    window.api.readMedia(src, getCurrentDocDir() ?? undefined).then(result => {
      if (cancelled) return
      if (result) {
        setDataUrl(result)
        setStatus('ok')
      } else {
        setDataUrl(null)
        setStatus('missing')
      }
    })
    return () => { cancelled = true }
  }, [src, isLocalPath, retryTick])

  useEffect(() => {
    const handler = () => {
      // Solo reconsulta los nodos rotos: evita releer todos los medios del
      // documento cada vez que se guarda.
      if (statusRef.current === 'missing') setRetryTick(t => t + 1)
    }
    window.addEventListener(MEDIA_RETRY_EVENT, handler)
    return () => window.removeEventListener(MEDIA_RETRY_EVENT, handler)
  }, [])

  const retry = useCallback(() => {
    if (isLocalPath) setRetryTick(t => t + 1)
  }, [isLocalPath])

  return { status, dataUrl, retry }
}
