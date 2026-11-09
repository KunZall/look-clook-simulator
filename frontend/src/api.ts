export interface Step { order: number; from: number; to: number; distance: number; kind: 'seek' | 'jump' }
export interface Result { algorithm: string; sequence: number[]; steps: Step[]; total: number; jump_total: number; avg_seek: number; max_seek: number; moves: number }
export interface Pair { look: Result; clook: Result; diff_percent: number }
export interface Params { head: number; requests: number[]; min_cyl: number; max_cyl: number; direction: 'left' | 'right' }

export async function compare(p: Params): Promise<Pair> {
  const r = await fetch('/api/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
  const j = await r.json()
  if (!r.ok) throw new Error(typeof j.detail === 'string' ? j.detail : 'Invalid input.')
  return j
}