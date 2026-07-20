import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { supabase } from './supabaseClient'
import type { TablesInsert, TablesUpdate } from '../types/database.types'
import type {
  Asset,
  CompetitorInput,
  CompetitorRunWithSnapshots,
  Customer,
  Project,
  ProjectDeliverable,
  ProjectStage,
  Task,
} from './pipeline'

export type {
  Asset,
  CompetitorInput,
  CompetitorRunWithSnapshots,
  Customer,
  Project,
  ProjectDeliverable,
  ProjectStage,
  Task,
}

type CustomerInsert = TablesInsert<'customers'>
type CustomerUpdate = TablesUpdate<'customers'>
type AssetInsert = TablesInsert<'assets'>
type AssetUpdate = TablesUpdate<'assets'>
type TaskInsert = TablesInsert<'tasks'>
type TaskUpdate = TablesUpdate<'tasks'>
type DeliverableInsert = TablesInsert<'project_deliverables'>
type DeliverableUpdate = TablesUpdate<'project_deliverables'>
type CompetitorRunInsert = TablesInsert<'competitor_analysis_runs'>
type CompetitorSnapshotInsert = TablesInsert<'competitor_snapshots'>

export type CreateCompetitorRunInput = {
  asset_id: number
  asset_name: string
  asset_url: string
  search_location_code: number
  search_location_name: string
  search_language_code: string
  competitors: CompetitorInput[]
}

interface DataState {
  loading: boolean
  error: string | null
  customers: Customer[]
  projects: Project[]
  assets: Asset[]
  stages: ProjectStage[]
  tasks: Task[]
  deliverables: ProjectDeliverable[]
  refresh: () => Promise<void>
  updateProject: (id: number, patch: Partial<Project>) => Promise<void>
  createProject: (row: TablesInsert<'projects'>) => Promise<Project>
  updateCustomer: (id: number, patch: CustomerUpdate) => Promise<Customer>
  createCustomer: (row: CustomerInsert) => Promise<Customer>
  updateAsset: (id: number, patch: AssetUpdate) => Promise<Asset>
  createAsset: (row: AssetInsert) => Promise<Asset>
  updateTask: (id: number, patch: TaskUpdate) => Promise<Task>
  createTask: (row: TaskInsert) => Promise<Task>
  createDeliverable: (row: DeliverableInsert) => Promise<ProjectDeliverable>
  updateDeliverable: (id: number, patch: DeliverableUpdate) => Promise<ProjectDeliverable>
  deleteDeliverable: (id: number) => Promise<void>
  fetchCompetitorRunsForAsset: (assetId: number) => Promise<CompetitorRunWithSnapshots[]>
  createCompetitorRun: (input: CreateCompetitorRunInput) => Promise<CompetitorRunWithSnapshots>
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])

  const refresh = useCallback(async () => {
    setError(null)
    const [custRes, projRes, assetRes, stageRes, taskRes, delRes] = await Promise.all([
      supabase.from('customers').select('*').order('business_name'),
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('assets').select('*').order('name'),
      supabase.from('project_stages').select('*').order('ordinal'),
      supabase.from('tasks').select('*').order('due_on', { ascending: true, nullsFirst: false }),
      supabase.from('project_deliverables').select('*').order('id'),
    ])
    const err =
      custRes.error?.message ??
      projRes.error?.message ??
      assetRes.error?.message ??
      stageRes.error?.message ??
      taskRes.error?.message ??
      delRes.error?.message ??
      null
    if (err) {
      setError(err)
      return
    }
    setCustomers(custRes.data ?? [])
    setProjects(projRes.data ?? [])
    setAssets(assetRes.data ?? [])
    setStages(stageRes.data ?? [])
    setTasks(taskRes.data ?? [])
    setDeliverables(delRes.data ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await refresh()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const updateProject = useCallback(
    async (id: number, patch: Partial<Project>) => {
      const { error: updErr } = await supabase.from('projects').update(patch).eq('id', id)
      if (updErr) throw new Error(updErr.message)
      await refresh()
    },
    [refresh],
  )

  const createProject = useCallback(
    async (row: TablesInsert<'projects'>) => {
      const { data, error: insErr } = await supabase
        .from('projects')
        .insert(row)
        .select('*')
        .single()
      if (insErr) throw new Error(insErr.message)
      await refresh()
      return data
    },
    [refresh],
  )

  const updateCustomer = useCallback(
    async (id: number, patch: CustomerUpdate) => {
      const { data, error: updErr } = await supabase
        .from('customers')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (updErr) throw new Error(updErr.message)
      await refresh()
      return data
    },
    [refresh],
  )

  const createCustomer = useCallback(
    async (row: CustomerInsert) => {
      const { data, error: insErr } = await supabase
        .from('customers')
        .insert(row)
        .select('*')
        .single()
      if (insErr) throw new Error(insErr.message)
      await refresh()
      return data
    },
    [refresh],
  )

  const updateAsset = useCallback(
    async (id: number, patch: AssetUpdate) => {
      const { data, error: updErr } = await supabase
        .from('assets')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (updErr) throw new Error(updErr.message)
      await refresh()
      return data
    },
    [refresh],
  )

  const createAsset = useCallback(
    async (row: AssetInsert) => {
      const { data, error: insErr } = await supabase
        .from('assets')
        .insert(row)
        .select('*')
        .single()
      if (insErr) throw new Error(insErr.message)
      await refresh()
      return data
    },
    [refresh],
  )

  const updateTask = useCallback(
    async (id: number, patch: TaskUpdate) => {
      const { data, error: updErr } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (updErr) throw new Error(updErr.message)
      await refresh()
      return data
    },
    [refresh],
  )

  const createTask = useCallback(
    async (row: TaskInsert) => {
      const { data, error: insErr } = await supabase
        .from('tasks')
        .insert(row)
        .select('*')
        .single()
      if (insErr) throw new Error(insErr.message)
      await refresh()
      return data
    },
    [refresh],
  )

  const createDeliverable = useCallback(
    async (row: DeliverableInsert) => {
      const { data, error: insErr } = await supabase
        .from('project_deliverables')
        .insert(row)
        .select('*')
        .single()
      if (insErr) throw new Error(insErr.message)
      await refresh()
      return data
    },
    [refresh],
  )

  const updateDeliverable = useCallback(
    async (id: number, patch: DeliverableUpdate) => {
      const { data, error: updErr } = await supabase
        .from('project_deliverables')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (updErr) throw new Error(updErr.message)
      await refresh()
      return data
    },
    [refresh],
  )

  const deleteDeliverable = useCallback(
    async (id: number) => {
      const { error: delErr } = await supabase.from('project_deliverables').delete().eq('id', id)
      if (delErr) throw new Error(delErr.message)
      await refresh()
    },
    [refresh],
  )

  const fetchCompetitorRunsForAsset = useCallback(async (assetId: number) => {
    const { data, error: fetchErr } = await supabase
      .from('competitor_analysis_runs')
      .select('*, competitor_snapshots(*)')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })
    if (fetchErr) throw new Error(fetchErr.message)
    return (data ?? []) as CompetitorRunWithSnapshots[]
  }, [])

  const createCompetitorRun = useCallback(
    async (input: CreateCompetitorRunInput) => {
      const runRow: CompetitorRunInsert = {
        asset_id: input.asset_id,
        search_location_code: input.search_location_code,
        search_location_name: input.search_location_name,
        search_language_code: input.search_language_code,
        competitor_inputs: input.competitors,
        status: 'pending',
      }
      const { data: run, error: runErr } = await supabase
        .from('competitor_analysis_runs')
        .insert(runRow)
        .select('*')
        .single()
      if (runErr) throw new Error(runErr.message)

      const snapshots: CompetitorSnapshotInsert[] = [
        {
          asset_id: input.asset_id,
          run_id: run.id,
          type: 'target',
          business_name: input.asset_name,
          url: input.asset_url,
          location: '',
          notes: '',
        },
        ...input.competitors.map((c) => ({
          asset_id: input.asset_id,
          run_id: run.id,
          type: 'competitor' as const,
          business_name: c.business_name,
          url: c.url,
          location: c.location ?? '',
          notes: '',
        })),
      ]
      const { error: snapErr } = await supabase.from('competitor_snapshots').insert(snapshots)
      if (snapErr) throw new Error(snapErr.message)

      return { ...run, competitor_snapshots: [] } as CompetitorRunWithSnapshots
    },
    [],
  )

  const value = useMemo(
    () => ({
      loading,
      error,
      customers,
      projects,
      assets,
      stages,
      tasks,
      deliverables,
      refresh,
      updateProject,
      createProject,
      updateCustomer,
      createCustomer,
      updateAsset,
      createAsset,
      updateTask,
      createTask,
      createDeliverable,
      updateDeliverable,
      deleteDeliverable,
      fetchCompetitorRunsForAsset,
      createCompetitorRun,
    }),
    [
      loading,
      error,
      customers,
      projects,
      assets,
      stages,
      tasks,
      deliverables,
      refresh,
      updateProject,
      createProject,
      updateCustomer,
      createCustomer,
      updateAsset,
      createAsset,
      updateTask,
      createTask,
      createDeliverable,
      updateDeliverable,
      deleteDeliverable,
      fetchCompetitorRunsForAsset,
      createCompetitorRun,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
