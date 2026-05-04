import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual'

export interface UseGridVirtualizerOptions<T> {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  items: T[]
  cardMinWidth: number
  gridGap?: number
  contentPaddingX?: number
  estimatedRowHeight?: number
  maxColumns?: number
  overscan?: number
}

export interface UseGridVirtualizerResult<T> {
  columnsCount: number
  rows: Array<Array<T | null>>
  fixedColumnsStyle: React.CSSProperties
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
}

const DEFAULT_GRID_GAP = 16
const DEFAULT_CONTENT_PADDING_X = 32
const DEFAULT_ESTIMATED_ROW_HEIGHT = 200
const DEFAULT_OVERSCAN = 8

export function useGridVirtualizer<T>({
  scrollContainerRef,
  items,
  cardMinWidth,
  gridGap = DEFAULT_GRID_GAP,
  contentPaddingX = DEFAULT_CONTENT_PADDING_X,
  estimatedRowHeight = DEFAULT_ESTIMATED_ROW_HEIGHT,
  maxColumns,
  overscan = DEFAULT_OVERSCAN,
}: UseGridVirtualizerOptions<T>): UseGridVirtualizerResult<T> {
  const [containerWidth, setContainerWidth] = useState(0)

  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    setContainerWidth(el.getBoundingClientRect().width)
  }, [scrollContainerRef])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [scrollContainerRef])

  const columnsCount = useMemo(() => {
    const available = containerWidth - contentPaddingX
    if (available <= 0) return 1
    const computed = Math.max(1, Math.floor((available + gridGap) / (cardMinWidth + gridGap)))
    return maxColumns != null ? Math.min(maxColumns, computed) : computed
  }, [containerWidth, contentPaddingX, gridGap, cardMinWidth, maxColumns])

  const rows = useMemo(() => {
    const cols = Math.max(1, columnsCount)
    const result: Array<Array<T | null>> = []
    for (let i = 0; i < items.length; i += cols) {
      const row: Array<T | null> = items.slice(i, i + cols)
      while (row.length < cols) row.push(null)
      result.push(row)
    }
    return result
  }, [items, columnsCount])

  const fixedColumnsStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${Math.max(1, columnsCount)}, minmax(0, 1fr))` }),
    [columnsCount]
  )

  const virtualizerCacheRef = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    virtualizerCacheRef.current.clear()
  }, [columnsCount])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => virtualizerCacheRef.current.get(index) ?? estimatedRowHeight,
    measureElement: (el) => {
      const height = el.getBoundingClientRect().height
      const index = Number((el as HTMLElement).dataset.index)
      if (!Number.isNaN(index)) virtualizerCacheRef.current.set(index, height)
      return height
    },
    overscan,
  })

  return { columnsCount, rows, fixedColumnsStyle, rowVirtualizer }
}
