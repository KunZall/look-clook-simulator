import { Result } from '../api'

// Cylinder on x-axis, time (step) on y-axis: the classic head-movement chart + a live track bar.
export default function DiskVisualizer({ r, idx, head, min, max }: { r: Result; idx: number; head: number; min: number; max: number }) {
  const n = r.steps.length, i = Math.min(idx, n)
  const x = (c: number) => 30 + ((c - min) / (max - min)) * 940
  const y = (k: number) => 110 + k * 34
  const pos = i === 0 ? head : r.steps[i - 1].to
  const last = i > 0 ? r.steps[i - 1] : null
  const ticks = Array.from({ length: 5 }, (_, k) => Math.round(min + ((max - min) * k) / 4))
  return (
    <svg viewBox={`0 0 1000 ${y(n) + 30}`} className="viz" role="img" aria-label={`${r.algorithm} disk head movement`}>
      <rect x={30} y={30} width={940} height={8} rx={4} fill="#151515" stroke="#007BA7" strokeOpacity={.5} />
      {ticks.map(t => <text key={t} x={x(t)} y={65} fill="#888" fontSize={12} textAnchor="middle">{t}</text>)}
      <circle cx={x(pos)} cy={34} r={9} fill="#FF2E63" style={{ transition: 'cx .5s ease' }} />
      <text x={x(pos)} y={18} fill="#fff" fontSize={12} textAnchor="middle">{pos}</text>
      {last && <text x={970} y={90} fill="#888" fontSize={12} textAnchor="end">
        {last.kind === 'jump' ? '⟲ circular jump' : last.to >= last.from ? 'moving → right' : '← moving left'} · seek {last.distance}</text>}
      <circle cx={x(head)} cy={y(0)} r={9} fill="none" stroke="#fff" strokeWidth={2} />
      <text x={x(head)} y={y(0) - 14} fill="#fff" fontSize={12} textAnchor="middle">start {head}</text>
      {r.steps.map((s, k) => k < i && (
        <g key={k}>
          <line x1={x(s.from)} y1={y(k)} x2={x(s.to)} y2={y(k + 1)} stroke={s.kind === 'jump' ? '#FF2E63' : '#007BA7'}
            strokeWidth={k === i - 1 ? 3 : 2} strokeDasharray={s.kind === 'jump' ? '6 5' : undefined} />
          <text x={(x(s.from) + x(s.to)) / 2 + 8} y={(y(k) + y(k + 1)) / 2 + 4} fill="#888" fontSize={11}>{s.distance}</text>
        </g>))}
      {r.steps.map((s, k) => (
        <g key={'p' + k}>
          <circle cx={x(s.to)} cy={y(k + 1)} r={k === i - 1 ? 8 : 5}
            fill={k < i ? (k === i - 1 ? '#FF2E63' : '#fff') : 'none'} stroke={k < i ? '#fff' : '#007BA7'} />
          <text x={x(s.to)} y={y(k + 1) - 10} fill={k < i ? '#fff' : '#888'} fontSize={11} textAnchor="middle">{s.to}</text>
        </g>))}
    </svg>
  )
}
