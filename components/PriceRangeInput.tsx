const PRICE_OPTIONS: { label: string; value: number | null }[] = [
  { label: '전체', value: null },
  { label: '1백만', value: 100 },
  { label: '2백만', value: 200 },
  { label: '3백만', value: 300 },
  { label: '4백만', value: 400 },
  { label: '5백만', value: 500 },
  { label: '6백만', value: 600 },
  { label: '7백만', value: 700 },
  { label: '8백만', value: 800 },
  { label: '9백만', value: 900 },
  { label: '1천만', value: 1000 },
  { label: '2천만', value: 2000 },
  { label: '3천만', value: 3000 },
  { label: '4천만', value: 4000 },
  { label: '5천만', value: 5000 },
  { label: '6천만', value: 6000 },
  { label: '7천만', value: 7000 },
  { label: '8천만', value: 8000 },
  { label: '9천만', value: 9000 },
  { label: '1억', value: 10000 },
  { label: '1.5억', value: 15000 },
  { label: '2억', value: 20000 },
  { label: '2.5억', value: 25000 },
  { label: '3억', value: 30000 },
  { label: '3.5억', value: 35000 },
  { label: '4억', value: 40000 },
  { label: '5억', value: 50000 },
  { label: '6억', value: 60000 },
  { label: '7억', value: 70000 },
  { label: '8억', value: 80000 },
  { label: '9억', value: 90000 },
  { label: '10억', value: 100000 },
  { label: '20억', value: 200000 },
  { label: '30억', value: 300000 },
  { label: '40억', value: 400000 },
  { label: '50억', value: 500000 },
  { label: '100억', value: 1000000 },
]

type Props = {
  label: string
  min: number | null
  max: number | null
  onChangeMin: (value: number | null) => void
  onChangeMax: (value: number | null) => void
}

function PriceSelect({
  value,
  onChange,
}: {
  value: number | null
  onChange: (value: number | null) => void
}) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value
    onChange(raw === '' ? null : Number(raw))
  }

  return (
    <select
      value={value ?? ''}
      onChange={handleChange}
      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
    >
      {PRICE_OPTIONS.map((opt) => (
        <option key={opt.label} value={opt.value ?? ''}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export default function PriceRangeInput({ label, min, max, onChangeMin, onChangeMax }: Props) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <PriceSelect value={min} onChange={onChangeMin} />
        <span className="text-slate-400 text-sm shrink-0">~</span>
        <PriceSelect value={max} onChange={onChangeMax} />
      </div>
    </div>
  )
}
