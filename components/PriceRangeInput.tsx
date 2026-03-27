// 웹사이트 단위: 원 / DB 단위: 만원 → 값은 만원으로 저장
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
  { label: '60억', value: 600000 },
  { label: '70억', value: 700000 },
  { label: '80억', value: 800000 },
  { label: '90억', value: 900000 },
  { label: '100억', value: 1000000 },
  { label: '200억', value: 2000000 },
  { label: '300억', value: 3000000 },
  { label: '400억', value: 4000000 },
  { label: '500억', value: 5000000 },
  { label: '600억', value: 6000000 },
  { label: '700억', value: 7000000 },
  { label: '800억', value: 8000000 },
  { label: '900억', value: 9000000 },
  { label: '1000억', value: 10000000 },
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
      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
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
      <h2 className="text-sm font-semibold text-gray-700 mb-2">{label}</h2>
      <div className="flex items-center gap-2">
        <PriceSelect value={min} onChange={onChangeMin} />
        <span className="text-gray-500 text-sm">원 ~</span>
        <PriceSelect value={max} onChange={onChangeMax} />
        <span className="text-gray-500 text-sm">원</span>
      </div>
    </div>
  )
}
