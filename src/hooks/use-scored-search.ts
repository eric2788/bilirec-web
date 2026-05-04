import { useMemo } from 'react'

export interface ScoredSearchField<T> {
  getValue: (item: T) => string | number | null | undefined
  exact: number
  startsWith: number
  includes: number
  when?: (normalizedQuery: string, item: T) => boolean
}

export interface UseScoredSearchOptions<T> {
  items: T[]
  query: string
  fields: ScoredSearchField<T>[]
  normalize?: (value: string) => string
  minScore?: number
}

export function useScoredSearch<T>({
  items,
  query,
  fields,
  normalize = (value) => value.trim().toLowerCase(),
  minScore = 1,
}: UseScoredSearchOptions<T>): T[] {
  return useMemo(() => {
    const normalizedQuery = normalize(query)
    if (!normalizedQuery) {
      return items
    }

    return items
      .map((item, index) => {
        let score = 0

        for (const field of fields) {
          if (field.when && !field.when(normalizedQuery, item)) {
            continue
          }

          const rawValue = field.getValue(item)
          const normalizedValue = normalize(String(rawValue ?? ''))
          if (!normalizedValue) {
            continue
          }

          if (normalizedValue === normalizedQuery) {
            score = Math.max(score, field.exact)
          }
          if (normalizedValue.startsWith(normalizedQuery)) {
            score = Math.max(score, field.startsWith)
          }
          if (normalizedValue.includes(normalizedQuery)) {
            score = Math.max(score, field.includes)
          }
        }

        return { item, index, score }
      })
      .filter((entry) => entry.score >= minScore)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }
        return a.index - b.index
      })
      .map((entry) => entry.item)
  }, [items, query, fields, normalize, minScore])
}
