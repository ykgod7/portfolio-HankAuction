const RESIDENTIAL_TYPES = ['아파트', '다세대/빌라', '주택', '근린주택', '다가구', '주거용 기타']
const COMMERCIAL_TYPES = [
  '근린상가', '근린시설', '오피스텔', '사무실', '교육시설', '노유자시설',
  '공장', '아파트형공장', '창고', '자동차시설', '주유소', '업무시설',
  '숙박시설', '판매시설', '의료시설', '종교시설', '문화/집회시설', '상업용 기타',
]

type Props = {
  selected: string[]
  onChange: (types: string[]) => void
}

function GroupSection({
  title,
  items,
  selected,
  onChange,
}: {
  title: string
  items: string[]
  selected: string[]
  onChange: (types: string[]) => void
}) {
  const allSelected = items.every((item) => selected.includes(item))

  const toggleAll = () => {
    if (allSelected) {
      onChange(selected.filter((s) => !items.includes(s)))
    } else {
      const toAdd = items.filter((item) => !selected.includes(item))
      onChange([...selected, ...toAdd])
    }
  }

  const toggleOne = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item))
    } else {
      onChange([...selected, item])
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <button
          onClick={toggleAll}
          className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
        >
          {allSelected ? '전체 해제' : '전체 선택'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => toggleOne(item)}
            className={`px-3 py-1 rounded-full text-sm border transition-all ${
              selected.includes(item)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TypeSelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <GroupSection
        title="주거용"
        items={RESIDENTIAL_TYPES}
        selected={selected}
        onChange={onChange}
      />
      <div className="border-t border-slate-100" />
      <GroupSection
        title="상업용"
        items={COMMERCIAL_TYPES}
        selected={selected}
        onChange={onChange}
      />
    </div>
  )
}
