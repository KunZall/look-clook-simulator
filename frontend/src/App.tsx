import { useEffect, useState } from 'react'
import { LayoutDashboard, MoveRight, Repeat, GitCompare, BarChart3, BookOpen, Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts'
import DiskVisualizer from './components/DiskVisualizer'
import { compare, Pair, Result } from './api'

const PAGES = [['Dashboard', LayoutDashboard], ['LOOK Simulation', MoveRight], ['C-LOOK Simulation', Repeat],
  ['Algorithm Comparison', GitCompare], ['Statistics', BarChart3], ['About Project', BookOpen]] as const
const SAMPLES = [
  { name: 'Textbook', head: '53', reqs: '98, 183, 37, 122, 14, 124, 65, 67', dir: 'right' },
  { name: 'Left start', head: '50', reqs: '82, 170, 43, 140, 24, 16, 190', dir: 'left' },
  { name: 'Duplicates', head: '50', reqs: '50, 50, 60, 10, 10, 180', dir: 'right' }]

const Metric = ({ label, value, cls = '' }: { label: string; value: string | number; cls?: string }) =>
  <div className="card metric"><b className={cls}>{value}</b><span>{label}</span></div>

export default function App() {
  const [page, setPage] = useState(0)
  const [f, setF] = useState({ head: '53', reqs: '98, 183, 37, 122, 14, 124, 65, 67', min: '0', max: '199', dir: 'right' })
  const [pair, setPair] = useState<Pair | null>(null)
  const [used, setUsed] = useState({ head: 53, min: 0, max: 199 })
  const [error, setError] = useState('')
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(700)
  const total = pair ? Math.max(pair.look.steps.length, pair.clook.steps.length) : 0

  useEffect(() => {
    if (!playing) return
    if (idx >= total) { setPlaying(false); return }
    const t = setTimeout(() => setIdx(i => i + 1), speed)
    return () => clearTimeout(t)
  }, [playing, idx, total, speed])

  async function start() {
    setError('')
    const nums = f.reqs.split(/[\s,]+/).filter(Boolean).map(Number)
    const head = Number(f.head), min = Number(f.min), max = Number(f.max)
    if ([head, min, max, ...nums].some(n => !Number.isInteger(n))) return setError('All values must be whole numbers (requests separated by commas).')
    try {
      const p = await compare({ head, requests: nums, min_cyl: min, max_cyl: max, direction: f.dir as 'left' | 'right' })
      setPair(p); setUsed({ head, min, max }); setIdx(0); setPlaying(true)
    } catch (e) { setError((e as Error).message) }
  }
  const reset = () => { setPlaying(false); setIdx(0) }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  const Controls = (
    <div className="card">
      <div className="grid">
        <div><label>Head position</label><input value={f.head} onChange={set('head')} /></div>
        <div><label>Min cylinder</label><input value={f.min} onChange={set('min')} /></div>
        <div><label>Max cylinder</label><input value={f.max} onChange={set('max')} /></div>
        <div><label>Direction</label><select value={f.dir} onChange={set('dir')}><option value="right">Right</option><option value="left">Left</option></select></div>
      </div>
      <div style={{ marginTop: 12 }}><label>Request queue</label><input value={f.reqs} onChange={set('reqs')} /></div>
      <div className="row">{SAMPLES.map(s => <button key={s.name} className="btn" onClick={() => setF({ ...f, head: s.head, reqs: s.reqs, dir: s.dir, min: '0', max: '199' })}>{s.name}</button>)}</div>
      <div className="row">
        <button className="btn primary" onClick={start}><Play size={16} />Start Simulation</button>
        <button className="btn" disabled={!pair || !playing} onClick={() => setPlaying(false)}><Pause size={16} />Pause</button>
        <button className="btn" disabled={!pair || playing || idx >= total} onClick={() => setPlaying(true)}>Resume</button>
        <button className="btn" disabled={!pair || playing || idx <= 0} onClick={() => setIdx(i => i - 1)}><SkipBack size={16} />Previous</button>
        <button className="btn" disabled={!pair || playing || idx >= total} onClick={() => setIdx(i => i + 1)}>Next<SkipForward size={16} /></button>
        <button className="btn rose" onClick={reset}><RotateCcw size={16} />Reset</button>
        <label style={{ margin: 0 }}>Speed&nbsp;<input type="range" min={100} max={1500} step={100} style={{ width: 120 }} value={1600 - speed} onChange={e => setSpeed(1600 - Number(e.target.value))} /></label>
      </div>
      {error && <div className="err" role="alert">⚠ {error}</div>}
    </div>)

  const pos = (r: Result) => (idx === 0 ? used.head : r.steps[Math.min(idx, r.steps.length) - 1].to)
  const status = !pair ? 'Idle' : idx >= total ? 'Completed' : playing ? 'Running' : 'Paused'
  const sim = (key: 'look' | 'clook') => {
    const r = pair?.[key]
    const done = r ? r.steps.slice(0, Math.min(idx, r.steps.length)) : []
    return <>{Controls}
      {r && <>
        <div className="grid">
          <Metric label="Head position" value={pos(r)} cls="rose" /><Metric label="Requests" value={r.moves} />
          <Metric label="Movement so far" value={done.reduce((a, s) => a + s.distance, 0)} cls="blue" />
          <Metric label="Total movement" value={r.total} />{key === 'clook' && <Metric label="Circular jump" value={r.jump_total} cls="rose" />}
          <Metric label="Status" value={status} /></div>
        <div className="card scroll"><DiskVisualizer r={r} idx={idx} head={used.head} min={used.min} max={used.max} /></div>
        <div className="card"><h3>Request queue (service order)</h3>
          <p>{r.sequence.map((c, k) => <span key={k} style={{ color: k < idx ? '#fff' : '#888', fontWeight: k === idx - 1 ? 700 : 400 }}>{c}{k < r.sequence.length - 1 ? ' → ' : ''}</span>)}</p></div></>}
      {!pair && <p className="sub">Press Start Simulation to run the algorithm.</p>}</>
  }

  const L = pair?.look, C = pair?.clook
  const seekData = pair ? Array.from({ length: total }, (_, k) => ({ step: k + 1, LOOK: L!.steps[k]?.distance, 'C-LOOK': C!.steps[k]?.distance })) : []
  const orderData = pair ? Array.from({ length: total + 1 }, (_, k) => ({ step: k, LOOK: k ? L!.sequence[k - 1] : used.head, 'C-LOOK': k ? C!.sequence[k - 1] : used.head })) : []
  const totals = pair ? [{ name: 'Total movement', LOOK: L!.total, 'C-LOOK': C!.total }, { name: 'Avg seek', LOOK: L!.avg_seek, 'C-LOOK': C!.avg_seek }, { name: 'Max seek', LOOK: L!.max_seek, 'C-LOOK': C!.max_seek }] : []
  const chart = (el: React.ReactElement) => <div style={{ height: 280 }}><ResponsiveContainer>{el}</ResponsiveContainer></div>
  const bars = <><CartesianGrid stroke="#222" /><XAxis dataKey="name" stroke="#888" /><YAxis stroke="#888" /><Tooltip contentStyle={{ background: '#151515', border: '1px solid #007BA7' }} /><Legend />
    <Bar dataKey="LOOK" fill="#007BA7" /><Bar dataKey="C-LOOK" fill="#FF2E63" /></>
  const lines = (k: string) => <><CartesianGrid stroke="#222" /><XAxis dataKey={k} stroke="#888" /><YAxis stroke="#888" /><Tooltip contentStyle={{ background: '#151515', border: '1px solid #007BA7' }} /><Legend />
    <Line dataKey="LOOK" stroke="#007BA7" /><Line dataKey="C-LOOK" stroke="#FF2E63" /></>

  const verdict = () => {
    if (!pair) return ''
    const d = pair.diff_percent, better = d < 0 ? 'C-LOOK' : d > 0 ? 'LOOK' : null
    return (better ? `For this input, ${better} needs ${Math.abs(d)}% ${d > 0 ? 'less' : 'less'} head movement (${better === 'LOOK' ? `${L!.total} vs ${C!.total}` : `${C!.total} vs ${L!.total}`}). ` : 'Both algorithms need equal head movement for this input. ') +
      `This is not a universal result: C-LOOK's jump is counted in full and it gives more uniform waiting times, while LOOK reverses and re-sweeps. Which is cheaper depends on how requests are distributed and on the initial direction.`
  }

  const about: [string, string][] = [
    ['Abstract', 'This project simulates and compares the LOOK and C-LOOK disk scheduling algorithms with step-by-step visualisation, real head-movement metrics and charts.'],
    ['Problem Statement', 'A disk head must service pending cylinder requests; the order determines seek time. We need to compare two elevator-style policies fairly.'],
    ['Objectives', 'Implement LOOK and C-LOOK correctly; visualise head movement; compare total/average/maximum seek on identical input.'],
    ['Existing System', 'FCFS, SSTF, SCAN and C-SCAN. SCAN/C-SCAN travel to the physical disk end even when no request is there.'],
    ['Proposed System', 'LOOK and C-LOOK stop at the last request in a direction, avoiding useless travel to the disk edge.'],
    ['Methodology', 'Python/FastAPI executes the algorithms and returns every step; React replays them and draws charts. Same input → same output (deterministic).'],
    ['Complexity', 'Sorting dominates: O(n log n) time, O(n) space for n requests.'],
    ['Advantages', 'LOOK: less movement than SCAN, good throughput. C-LOOK: more uniform wait times, no reversal.'],
    ['Disadvantages', 'LOOK: requests near the edges may wait longer. C-LOOK: the return jump adds movement and services nothing during the jump.'],
    ['Applications / Limitations', 'Conceptual model for HDD scheduling. SSDs have no seek time; the model ignores rotational latency and request arrival over time.'],
    ['Conclusion', 'Neither algorithm is always better; the winner depends on request distribution and starting direction.']]
  const pageEl = [
    <>
      <h2>LOOK vs C-LOOK</h2><p className="sub">Interactive Disk Scheduling Visualization and Performance Analysis</p>
      <div className="grid">
        <Metric label="Head position" value={pair ? pos(L!) : '—'} cls="rose" /><Metric label="Total requests" value={L?.moves ?? '—'} />
        <Metric label="LOOK movement" value={L?.total ?? '—'} cls="blue" /><Metric label="C-LOOK movement" value={C?.total ?? '—'} cls="blue" />
        <Metric label="Simulation status" value={status} /></div>
      <div className="grid">
        <div className="card"><h3 className="blue">LOOK</h3><p>Sweeps in one direction to the last request, reverses, and services the rest on the way back. Never travels to the disk end without a request.</p><button className="btn" onClick={() => setPage(1)}>Open LOOK</button></div>
        <div className="card"><h3 className="rose">C-LOOK</h3><p>Sweeps to the last request, jumps to the first request at the other end, and continues in the same direction.</p><button className="btn" onClick={() => setPage(2)}>Open C-LOOK</button></div></div>
      {Controls}</>,
    sim('look'), sim('clook'),
    <>{Controls}<h2>Algorithm Comparison</h2>
      {!pair ? <p className="sub">Run a simulation to compare.</p> : <>
        <div className="grid">{[L!, C!].map(r => <div key={r.algorithm} className="card scroll"><h3>{r.algorithm}</h3><DiskVisualizer r={r} idx={idx} head={used.head} min={used.min} max={used.max} /></div>)}</div>
        <div className="card scroll"><table><thead><tr><th>Metric</th><th>LOOK</th><th>C-LOOK</th></tr></thead><tbody>
          <tr><td>Service sequence</td><td>{L!.sequence.join(', ')}</td><td>{C!.sequence.join(', ')}</td></tr>
          <tr><td>Total head movement</td><td>{L!.total}</td><td>{C!.total}</td></tr>
          <tr><td>Average seek</td><td>{L!.avg_seek}</td><td>{C!.avg_seek}</td></tr>
          <tr><td>Head movements</td><td>{L!.moves}</td><td>{C!.moves}</td></tr>
          <tr><td>Maximum seek</td><td>{L!.max_seek}</td><td>{C!.max_seek}</td></tr>
          <tr><td>Circular jump distance</td><td>—</td><td>{C!.jump_total}</td></tr>
          <tr><td>C-LOOK vs LOOK movement</td><td colSpan={2}>{pair.diff_percent > 0 ? '+' : ''}{pair.diff_percent}%</td></tr></tbody></table></div>
        <div className="card">{chart(<BarChart data={totals}>{bars}</BarChart>)}<p>{verdict()}</p></div></>}</>,
    <><h2>Statistics</h2>
      {!pair ? <p className="sub">Run a simulation to see statistics computed from the actual execution.</p> : <>
        <div className="grid"><Metric label="Requests serviced" value={L!.moves} /><Metric label="LOOK total" value={L!.total} cls="blue" /><Metric label="C-LOOK total" value={C!.total} cls="rose" />
          <Metric label="LOOK avg / max" value={`${L!.avg_seek} / ${L!.max_seek}`} /><Metric label="C-LOOK avg / max" value={`${C!.avg_seek} / ${C!.max_seek}`} /></div>
        <div className="card"><h3>Performance comparison</h3>{chart(<BarChart data={totals}>{bars}</BarChart>)}</div>
        <div className="card"><h3>Individual seek distances</h3>{chart(<BarChart data={seekData.map(d => ({ ...d, name: d.step }))}>{bars}</BarChart>)}</div>
        <div className="card"><h3>Request service order (cylinder at each step)</h3>{chart(<LineChart data={orderData}>{lines('step')}</LineChart>)}</div></>}</>,
    <><h2>About Project</h2>
      {about.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>)}
      <div className="card"><h3>LOOK pseudocode</h3><pre>{`sort requests
A = requests >= head, ascending (direction right)
B = requests <  head, descending
service A in order, then reverse and service B
total = sum of |next - current|`}</pre><h3>Flow: LOOK</h3><pre>{`Start → read head, queue, direction → split queue at head
→ service requests ahead → (last request reached) → reverse
→ service remaining → End`}</pre></div>
      <div className="card"><h3>C-LOOK pseudocode</h3><pre>{`sort requests
A = requests >= head, ascending
B = requests <  head, ascending
service A in order
if B not empty: jump to B[0] (jump distance counted), service B in order
total = sum of |next - current| including the jump`}</pre><h3>Flow: C-LOOK</h3><pre>{`Start → read head, queue, direction → split queue at head
→ service requests ahead → (last request reached) → JUMP to first request at far end
→ continue SAME direction → End`}</pre></div></>,
  ][page]

  return <div className="app"><nav><h1>LOOK vs C-LOOK</h1>
    {PAGES.map(([name, Icon], k) => <button key={name} className={page === k ? 'on' : ''} onClick={() => setPage(k)}><Icon size={16} />{name}</button>)}</nav>
    <main>{pageEl}</main></div>
}
