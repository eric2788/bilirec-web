import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { FileCard } from './FileCard'
import { EmptyState } from './EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CaretLeftIcon, MagnifyingGlassIcon, SpinnerGapIcon } from '@phosphor-icons/react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { RecordFile, RecordFileListResponse } from '@/lib/types'

type FilesLayoutConfig = {
  pageSize: number
  initialSkeletonCount: number
  pagingSkeletonCount: number
}

const getFilesLayoutConfig = (width: number): FilesLayoutConfig => {
  if (width < 768) {
    return {
      pageSize: 20,
      initialSkeletonCount: 6,
      pagingSkeletonCount: 3
    }
  }

  if (width < 1280) {
    return {
      pageSize: 36,
      initialSkeletonCount: 8,
      pagingSkeletonCount: 4
    }
  }

  return {
    pageSize: 60,
    initialSkeletonCount: 12,
    pagingSkeletonCount: 6
  }
}

function FileCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

const getFilesQueryKey = (path: string, search: string, pageSize: number) => [
  'files',
  path,
  search,
  pageSize
] as const

const normalizeList = (items?: RecordFile[]) => {
  return Array.isArray(items)
    ? items.filter((file) => !file.is_dir || file.name !== '..')
    : []
}

export function FilesView() {
  const [currentPath, setCurrentPath] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [displayFiles, setDisplayFiles] = useState<RecordFile[]>([])
  const [displayTotal, setDisplayTotal] = useState(0)
  const [isSearchTransition, setIsSearchTransition] = useState(false)
  const [layoutConfig, setLayoutConfig] = useState<FilesLayoutConfig>(() =>
    getFilesLayoutConfig(window.innerWidth)
  )
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)
  const prevPathRef = useRef(currentPath)
  const prevSearchRef = useRef(search)
  const lastAppliedSearchRef = useRef(search)
  const queryClient = useQueryClient()

  useEffect(() => {
    const onResize = () => {
      const next = getFilesLayoutConfig(window.innerWidth)
      setLayoutConfig((prev) => (
        prev.pageSize === next.pageSize &&
        prev.initialSkeletonCount === next.initialSkeletonCount &&
        prev.pagingSkeletonCount === next.pagingSkeletonCount
      )
        ? prev
        : next)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { pageSize, initialSkeletonCount, pagingSkeletonCount } = layoutConfig

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const queryKey = useMemo(
    () => getFilesQueryKey(currentPath, search, pageSize),
    [currentPath, search, pageSize]
  )

  const {
    data,
    isPending,
    isFetching,
    isFetchingNextPage,
    isSuccess,
    isError,
    error,
    fetchNextPage: fetchNextPageQuery,
    hasNextPage
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
      const data = await apiClient.getFiles(currentPath, pageParam, pageSize, search)
      return {
        ...data,
        items: normalizeList(data.items)
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: RecordFileListResponse, pages: RecordFileListResponse[]) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0)
      return loaded < lastPage.total ? loaded : undefined
    },
    staleTime: 15000
  })

  const queryFiles = useMemo(() => {
    if (!data?.pages?.length) return []
    return data.pages.flatMap((page: RecordFileListResponse) => page.items)
  }, [data])

  const queryTotal = useMemo(() => {
    if (!data?.pages?.length) return 0
    return data.pages[0]?.total ?? 0
  }, [data])

  const isInitialLoading = (isPending || isFetching) && displayFiles.length === 0
  const isLoadingMore = isFetchingNextPage
  const isDebouncingSearch = searchInput.trim() !== search
  const isSearching = isDebouncingSearch || isSearchTransition || (isFetching && search.length > 0)

  useEffect(() => {
    const isSearchOnlyChange =
      prevPathRef.current === currentPath &&
      prevSearchRef.current !== search

    if (prevPathRef.current !== currentPath) {
      // Path changed: clear immediately so skeleton can represent new directory load.
      setDisplayFiles([])
      setDisplayTotal(0)
      setIsSearchTransition(false)
    } else if (isSearchOnlyChange && displayFiles.length > 0) {
      // Search changed under same path: keep old items until new result arrives.
      setIsSearchTransition(true)
    }

    prevPathRef.current = currentPath
    prevSearchRef.current = search
  }, [currentPath, search, pageSize, displayFiles.length])

  useEffect(() => {
    if (!isSuccess) return

    if (lastAppliedSearchRef.current !== search) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      lastAppliedSearchRef.current = search
    }

    setDisplayFiles(queryFiles)
    setDisplayTotal(queryTotal)
    setIsSearchTransition(false)
  }, [isSuccess, queryFiles, queryTotal])

  useEffect(() => {
    if (isSearchTransition && !isFetching && !isDebouncingSearch) {
      setIsSearchTransition(false)
    }
  }, [isSearchTransition, isFetching, isDebouncingSearch])

  useEffect(() => {
    if (!isError) return
    const err = error as any
    toast.error('無法載入檔案列表' + (err?.response?.data ? `: ${err.response.data}` : ''))
  }, [isError, error])

  const handleFetchNextPage = useCallback(async () => {
    if (isInitialLoading || isLoadingMore || isSearchTransition || !hasNextPage) return
    await fetchNextPageQuery()
  }, [isInitialLoading, isLoadingMore, isSearchTransition, hasNextPage, fetchNextPageQuery])

  useEffect(() => {
    const root = scrollContainerRef.current
    const target = loadMoreTriggerRef.current
    if (!root || !target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          void handleFetchNextPage()
        }
      },
      {
        root,
        rootMargin: '0px 0px 220px 0px',
        threshold: 0.01
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [handleFetchNextPage])

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
  }

  const handleBack = () => {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    setCurrentPath(parts.join('/'))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-4 border-b border-border">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex items-center gap-2">
            {currentPath && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
              >
                <CaretLeftIcon size={20} />
              </Button>
            )}
            <h2 className="text-xl font-bold">錄製檔案</h2>
          </div>

          <div className="ml-auto w-[200px] sm:w-[280px]">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <MagnifyingGlassIcon size={16} />
              </span>
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜尋檔名..."
                className="pl-9 pr-20"
                aria-busy={isSearching}
              />

              <div
                className={`pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-muted-foreground transition-opacity duration-200 ${
                  isSearching ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="animate-spin">
                  <SpinnerGapIcon size={14} />
                </span>
                <span>搜尋中</span>
              </div>
            </div>
          </div>
        </div>

        {currentPath && (
          <p className="text-sm text-muted-foreground truncate">
            {currentPath}
          </p>
        )}
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 pb-20">
        {isInitialLoading ? (
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
            {Array.from({ length: initialSkeletonCount }).map((_, index) => (
              <FileCardSkeleton key={`initial-skeleton-${index}`} />
            ))}
          </div>
        ) : displayFiles.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            title="還沒有錄製檔案"
            description="完成錄製後檔案會出現在這裡"
          />
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
            {displayFiles.map((file, index) => (
              <FileCard
                key={`${file.name}-${index}`}
                file={file}
                onNavigate={handleNavigate}
                onDelete={() => {
                  void queryClient.invalidateQueries({ queryKey })
                }}
                currentPath={currentPath}
              />
            ))}
            {isLoadingMore && Array.from({ length: pagingSkeletonCount }).map((_, index) => (
              <FileCardSkeleton key={`paging-skeleton-${index}`} />
            ))}
          </div>
        )}

        {!isInitialLoading && displayFiles.length > 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            已載入 {displayFiles.length} / {displayTotal}
          </p>
        )}

        <div ref={loadMoreTriggerRef} className="h-1" aria-hidden />
      </div>
    </div>
  )
}
