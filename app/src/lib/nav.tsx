import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Page = 'pipeline' | 'customers' | 'tasks' | 'assets' | 'seo' | 'settings'

export type SeoTab = 'performance' | 'opportunities' | 'pages'

export type TasksIntent = {
  search: string
  filter?: 'all' | 'current'
}

export type AssetsIntent =
  | { mode: 'open'; assetId: number }
  | { mode: 'create'; customerId: number; projectId: number }

export type CustomersIntent = {
  customerId: number
}

export type PipelineIntent = {
  projectId: number
}

type AppNavValue = {
  page: Page
  setPage: (page: Page) => void
  seoTab: SeoTab
  setSeoTab: (tab: SeoTab) => void
  openSeo: (tab?: SeoTab) => void
  tasksIntent: TasksIntent | null
  consumeTasksIntent: () => void
  openTasksForProject: (projectName: string) => void
  assetsIntent: AssetsIntent | null
  consumeAssetsIntent: () => void
  openAssetRecord: (assetId: number) => void
  openAssetCreate: (customerId: number, projectId: number) => void
  customersIntent: CustomersIntent | null
  consumeCustomersIntent: () => void
  openCustomerRecord: (customerId: number) => void
  pipelineIntent: PipelineIntent | null
  consumePipelineIntent: () => void
  openProjectInPipeline: (projectId: number) => void
}

const AppNavContext = createContext<AppNavValue | null>(null)

export function AppNavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('pipeline')
  const [seoTab, setSeoTab] = useState<SeoTab>('performance')
  const [tasksIntent, setTasksIntent] = useState<TasksIntent | null>(null)
  const [assetsIntent, setAssetsIntent] = useState<AssetsIntent | null>(null)
  const [customersIntent, setCustomersIntent] = useState<CustomersIntent | null>(null)
  const [pipelineIntent, setPipelineIntent] = useState<PipelineIntent | null>(null)

  const consumeTasksIntent = useCallback(() => setTasksIntent(null), [])
  const consumeAssetsIntent = useCallback(() => setAssetsIntent(null), [])
  const consumeCustomersIntent = useCallback(() => setCustomersIntent(null), [])
  const consumePipelineIntent = useCallback(() => setPipelineIntent(null), [])

  const openTasksForProject = useCallback((projectName: string) => {
    setTasksIntent({ search: projectName, filter: 'all' })
    setPage('tasks')
  }, [])

  const openAssetRecord = useCallback((assetId: number) => {
    setAssetsIntent({ mode: 'open', assetId })
    setPage('assets')
  }, [])

  const openAssetCreate = useCallback((customerId: number, projectId: number) => {
    setAssetsIntent({ mode: 'create', customerId, projectId })
    setPage('assets')
  }, [])

  const openCustomerRecord = useCallback((customerId: number) => {
    setCustomersIntent({ customerId })
    setPage('customers')
  }, [])

  const openProjectInPipeline = useCallback((projectId: number) => {
    setPipelineIntent({ projectId })
    setPage('pipeline')
  }, [])

  const openSeo = useCallback((tab: SeoTab = 'performance') => {
    setSeoTab(tab)
    setPage('seo')
  }, [])

  const value = useMemo(
    () => ({
      page,
      setPage,
      seoTab,
      setSeoTab,
      openSeo,
      tasksIntent,
      consumeTasksIntent,
      openTasksForProject,
      assetsIntent,
      consumeAssetsIntent,
      openAssetRecord,
      openAssetCreate,
      customersIntent,
      consumeCustomersIntent,
      openCustomerRecord,
      pipelineIntent,
      consumePipelineIntent,
      openProjectInPipeline,
    }),
    [
      page,
      seoTab,
      openSeo,
      tasksIntent,
      consumeTasksIntent,
      openTasksForProject,
      assetsIntent,
      consumeAssetsIntent,
      openAssetRecord,
      openAssetCreate,
      customersIntent,
      consumeCustomersIntent,
      openCustomerRecord,
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
