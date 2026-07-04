const ITEMS = [
  'Backyard Ultra', 'Alvásmenedzsment', 'Táplálkozás', 'Mentális stratégia',
  '100 Mile', 'Felszerelés', 'Regeneráció', 'Versenytaktika', 'Trail Ultra',
]

export default function Ticker() {
  const doubled = [...ITEMS, ...ITEMS]
  return (
    <div className="overflow-hidden py-[11px] whitespace-nowrap" style={{ background: 'var(--forest2)' }}>
      <div style={{ display: 'inline-flex', animation: 'ticker 36s linear infinite' }}>
        {doubled.map((item, i) => (
          <span key={i} className="font-display text-[13px] tracking-[0.14em] px-7"
            style={{ color: 'var(--accent)' }}>
            {item} <span style={{ color: 'rgba(168,255,62,0.3)' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
