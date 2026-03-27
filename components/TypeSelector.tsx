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
  allLabel,
  items,
  selected,
  onChange,
}: {
  title: string
  allLabel: string
  items: string[]
  selected: string[]
  onChange: (types: string[]) => void
}) {
  const allSelected = items.every((item) => selected.includes(item))
  const someSelected = items.some((item) => selected.includes(item))

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
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</span>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
            onChange={toggleAll}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-sm text-gray-600">{allLabel}</span>
        </label>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(item)}
              onChange={() => toggleOne(item)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">{item}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function TypeSelector({ selected, onChange }: Props) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        물건 종류 <span className="text-gray-400 font-normal">(미선택 시 전체)</span>
      </h2>
      <div className="flex flex-col gap-5">
        <GroupSection
          title="주거용"
          allLabel="주거용 전체"
          items={RESIDENTIAL_TYPES}
          selected={selected}
          onChange={onChange}
        />
        <div className="border-t border-gray-100" />
        <GroupSection
          title="상업용"
          allLabel="상업용 전체"
          items={COMMERCIAL_TYPES}
          selected={selected}
          onChange={onChange}
        />
      </div>
    </div>
  )
}
