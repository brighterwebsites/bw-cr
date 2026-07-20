import type { Tables } from '../types/database.types'

export type ProjectStage = Tables<'project_stages'>
export type Project = Tables<'projects'>
export type Customer = Tables<'customers'>
export type Asset = Tables<'assets'>
export type Task = Tables<'tasks'>

export type StageTheme = {
  color: string
  light: string
  text: string
}

/** Visual palette aligned with legacy crm.html stage colours. */
export const STAGE_THEME: Record<number, StageTheme> = {
  1: { color: '#c41a1a', light: '#fde8e8', text: '#8b1212' },
  2: { color: '#6b5b4f', light: '#f0ebe8', text: '#4a3f36' },
  3: { color: '#c45000', light: '#fff0e5', text: '#8a3800' },
  4: { color: '#5a3fa8', light: '#eeedfe', text: '#3c3489' },
  5: { color: '#1a6d3b', light: '#e1f5ee', text: '#085041' },
  6: { color: '#1565c0', light: '#e3f0fc', text: '#0d437a' },
  7: { color: '#999999', light: '#f0f0f0', text: '#555555' },
}

export function stageTheme(stage: number): StageTheme {
  return STAGE_THEME[stage] ?? { color: '#4550c8', light: '#e2e5fb', text: '#242953' }
}

export function isClosed(stage: number): boolean {
  return stage === 7
}

export function stageOrdinal(stage: number, step: number, stages: ProjectStage[]): number {
  const idx = stages.findIndex((s) => s.stage === stage && s.step === step)
  return idx >= 0 ? idx : 0
}

export function stageLabel(stage: number, step: number, stages: ProjectStage[]): string {
  const row = stages.find((s) => s.stage === stage && s.step === step)
  return row?.stage_name ?? `Stage ${stage}`
}
