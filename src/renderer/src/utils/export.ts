import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportHtml(html: string, title: string): Promise<void> {
  const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{max-width:800px;margin:40px auto;padding:0 20px;font:16px/1.7 system-ui,sans-serif;color:#1a1a1a;}img{max-width:100%}pre{background:#f5f5f5;padding:16px;border-radius:6px;overflow-x:auto;}code{font-family:monospace;}</style></head><body>${html}</body></html>`], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/\.[^.]+$/, '')}.html`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPdf(element: HTMLElement, title: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = (canvas.height * pdfW) / canvas.width
  let heightLeft = pdfH
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, pdfW, pdfH)
  heightLeft -= pdf.internal.pageSize.getHeight()

  while (heightLeft > 0) {
    position = heightLeft - pdfH
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, pdfW, pdfH)
    heightLeft -= pdf.internal.pageSize.getHeight()
  }

  pdf.save(`${title.replace(/\.[^.]+$/, '')}.pdf`)
}
