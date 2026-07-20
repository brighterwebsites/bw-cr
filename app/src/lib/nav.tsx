import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Page = 'pipeline' | 'customers' | 'tasks' | 'assets'

export type TasksIntent = {
  search: string
  filter?: 'all' | 'current'
}

export type AssetsIntent = {
  assetId: number
}

export type PipelineIntent = {
  projectId: number
}

type AppNavValue = {
  page: Page
  setPage: (page: Page) => void
  tasksIntent: TasksIntent | null
  consumeTasksIntent: () => void
  openTasksForProject: (projectName: string) => void
  assetsIntent: AssetsIntent | null
  consumeAssetsIntent: () => void
  openAssetRecord: (assetId: number) => void
  pipelineIntent: PipelineIntent | null
  consumePipelineIntent: () => void
  openProjectInPipeline: (projectId: number) => void
}

const AppNavContext = createContext<AppNavValue | null>(null)

export function AppNavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('pipeline')
  const [tasksIntent, setTasksIntent] = useState<TasksIntent | null>(null)
  const [assetsIntent, setAssetsIntent] = useState<AssetsIntent | null>(null)
  const [pipelineIntent, setPipelineIntent] = useState<PipelineIntent | null>(null)

  const consumeTasksIntent = useCallback(() => setTasksIntent(null), [])
  const consumeAssetsIntent = useCallback(() => setAssetsIntent(null), [])
  const consumePipelineIntent = useCallback(() => setPipelineIntent(null), [])

  const openTasksForProject = useCallback((projectName: string) => {
    setTasksIntent({ search: projectName, filter: 'all' })
    setPage('tasks')
  }, [])

  const openAssetRecord = useCallback((assetId: number) => {
    setAssetsIntent({ assetId })
    setPage('assets')
  }, [])

  const openProjectInPipeline = useCallback((projectId: number) => {
    setPipelineIntent({ projectId })
    setPage('pipeline')
  }, [])

  const value = useMemo(
    () => ({
      page,
      setPage,
      tasksIntent,
      consumeTasksIntent,
      openTasksForProject,
      assetsIntent,
      consumeAssetsIntent,
      openAssetRecord,
      pipelineIntent,
      consumePipelineIntent,
      openProjectInPipeline,
    }),
    [
      page,
      tasksIntent,
      consumeTasksIntent,
      openTasksForProject,
      assetsIntent,
      consumeAssetsIntent,
      openAssetRecord,
      pipelineIntent,
      consumePipelineIntent,
      openProjectInPipeline,
    ],
  )

  return <AppNavContext.Provider value={value}>{children}</AppNavContext.Provider>
}

export function useAppNav() {
  const ctx = useContext(AppNavContext)
  if (!ctx) throw new Error('useAppNav must be used within AppNavProvider')
  return ctx
}
