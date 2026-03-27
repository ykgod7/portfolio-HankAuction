const REGIONS = [
  { label: '서울', value: '서울특별시' },
  { label: '경기', value: '경기도' },
  { label: '인천', value: '인천광역시' },
  { label: '부산', value: '부산광역시' },
  { label: '대구', value: '대구광역시' },
  { label: '대전', value: '대전광역시' },
  { label: '광주', value: '광주광역시' },
  { label: '울산', value: '울산광역시' },
  { label: '세종', value: '세종특별자치시' },
  { label: '강원', value: '강원도' },
  { label: '충북', value: '충청북도' },
  { label: '충남', value: '충청남도' },
  { label: '전북', value: '전라북도' },
  { label: '전남', value: '전라남도' },
  { label: '경북', value: '경상북도' },
  { label: '경남', value: '경상남도' },
  { label: '제주', value: '제주특별자치도' },
]

type Props = {
  selected: string[]
  onChange: (regions: string[]) => void
}

export default function RegionSelector({ selected, onChange }: Props) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((r) => r !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">
        지역 <span className="text-gray-400 font-normal">(미선택 시 전국)</span>
      </h2>
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((region) => (
          <button
            key={region.value}
            onClick={() => toggle(region.value)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              selected.includes(region.value)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {region.label}
          </button>
        ))}
      </div>
    </div>
  )
}
