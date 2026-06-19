import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface TableSortState {
  col: number
  asc: boolean
}

export const tableSortKey = new PluginKey<TableSortState | null>('table-sort')

export const TableSort = Extension.create({
  name: 'tableSort',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tableSortKey,
        state: {
          init() { return null },
          apply(tr, prev) {
            const meta = tr.getMeta(tableSortKey)
            return meta !== undefined ? meta : prev
          }
        },
        props: {
          decorations(state) {
            const sortState = tableSortKey.getState(state) as TableSortState | null
            if (!sortState) return DecorationSet.empty

            const decos: Decoration[] = []

            state.doc.descendants((node, pos) => {
              if (node.type.name === 'table') {
                const headerRow = node.firstChild
                if (!headerRow || sortState.col >= headerRow.childCount) return false

                // Calculate position of the target th within the table
                // table pos + 1 = position of first row
                // row pos + 1 = position of first cell
                let cellPos = pos + 2 // table opening + row opening
                for (let c = 0; c < sortState.col; c++) {
                  cellPos += headerRow.child(c).nodeSize
                }

                const thNode = headerRow.child(sortState.col)
                const className = sortState.asc ? 'sorted-asc' : 'sorted-desc'
                decos.push(
                  Decoration.node(cellPos, cellPos + thNode.nodeSize, { class: className })
                )
                return false
              }
              return true
            })

            return DecorationSet.create(state.doc, decos)
          }
        }
      })
    ]
  }
})
