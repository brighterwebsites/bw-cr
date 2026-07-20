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
import type { Customer, Project, ProjectStage, Task } from './pipeline'

export type { Customer, Project, ProjectStage, Task }

type CustomerInsert = TablesInsert<'customers'>
type CustomerUpdate = TablesUpdate<'customers'>

interface DataState {
  loading: boolean
  error: string | null
  customers: Customer[]
  projects: Project[]
  stages: ProjectStage[]
  tasks: Task[]
  refresh: () => Promise<void>
  updateProject: (id: number, patch: Partial<Project>) => Promise<void>
  updateCustomer: (id: number, patch: CustomerUpdate) => Promise<Customer>
  createCustomer: (row: CustomerInsert) => Promise<Customer>
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const refresh = useCallback(async () => {
    setError(null)
    const [custRes, projRes, stageRes, taskRes] = await Promise.all([
      supabase.from('customers').select('*').order('business_name'),
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('project_stages').select('*').order('ordinal'),
      supabase.from('tasks').select('*').order('due_on', { ascending: true, nullsFirst: false }),
    ])
    const err =
      custRes.error?.message ??
      projRes.error?.message ??
      stageRes.error?.message ??
      taskRes.error?.message ??
      null
    if (err) {
      setError(err)
      return
    }
    setCustomers(custRes.data ?? [])
    setProjects(projRes.data ?? [])
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

  const value = useMemo(
    () => ({
      loading,
      error,
      customers,
      projects,
      stages,
      tasks,
      refresh,
      updateProject,
      updateCustomer,
      createCustomer,
    }),
    [
      loading,
      error,
      customers,
      projects,
      stages,
      tasks,
      refresh,
      updateProject,
      updateCustomer,
      createCustomer,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
