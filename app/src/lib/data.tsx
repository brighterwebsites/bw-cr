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
import type { Asset, Customer, Project, ProjectStage, Task } from './pipeline'

export type { Asset, Customer, Project, ProjectStage, Task }

type CustomerInsert = TablesInsert<'customers'>
type CustomerUpdate = TablesUpdate<'customers'>
type AssetInsert = TablesInsert<'assets'>
type AssetUpdate = TablesUpdate<'assets'>
type TaskInsert = TablesInsert<'tasks'>
type TaskUpdate = TablesUpdate<'tasks'>

interface DataState {
  loading: boolean
  error: string | null
  customers: Customer[]
  projects: Project[]
  assets: Asset[]
  stages: ProjectStage[]
  tasks: Task[]
  refresh: () => Promise<void>
  updateProject: (id: number, patch: Partial<Project>) => Promise<void>
  createProject: (row: TablesInsert<'projects'>) => Promise<Project>
  updateCustomer: (id: number, patch: CustomerUpdate) => Promise<Customer>
  createCustomer: (row: CustomerInsert) => Promise<Customer>
  updateAsset: (id: number, patch: AssetUpdate) => Promise<Asset>
  createAsset: (row: AssetInsert) => Promise<Asset>
  updateTask: (id: number, patch: TaskUpdate) => Promise<Task>
  createTask: (row: TaskInsert) => Promise<Task>
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

  const refresh = useCallback(async () => {
    setError(null)
    const [custRes, projRes, assetRes, stageRes, taskRes] = await Promise.all([
      supabase.from('customers').select('*').order('business_name'),
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('assets').select('*').order('name'),
      supabase.from('project_stages').select('*').order('ordinal'),
      supabase.from('tasks').select('*').order('due_on', { ascending: true, nullsFirst: false }),
    ])
    const err =
      custRes.error?.message ??
      projRes.error?.message ??
      assetRes.error?.message ??
      stageRes.error?.message ??
      taskRes.error?.message ??
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

  const value = useMemo(
    () => ({
      loading,
      error,
      customers,
      projects,
      assets,
      stages,
      tasks,
      refresh,
      updateProject,
      createProject,
      updateCustomer,
      createCustomer,
      updateAsset,
      createAsset,
      updateTask,
      createTask,
    }),
    [
      loading,
      error,
      customers,
      projects,
      assets,
      stages,
      tasks,
      refresh,
      updateProject,
      createProject,
      updateCustomer,
      createCustomer,
      updateAsset,
      createAsset,
      updateTask,
      createTask,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
