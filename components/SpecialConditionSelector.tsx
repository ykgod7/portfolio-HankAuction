const SPECIAL_CONDITIONS = [
  '유치권',
  '지분경매',
  '재매각',
  '반값물건',
  '대항력 있는 임차인',
  '위반건축물',
  '1년전감정가',
  '오늘신건',
  'HUG 대항력 포기',
  '초보자 경매',
]

type Props = {
  selected: string[]
  onChange: (conditions: string[]) => void
}

export default function SpecialConditionSelector({ selected, onChange }: Props) {
  const toggle = (condition: string) => {
    if (selected.includes(condition)) {
      onChange(selected.filter((c) => c !== condition))
    } else {
      onChange([...selected, condition])
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">
        특수조건 <span className="text-gray-400 font-normal">(해당 태그 포함 물건만)</span>
      </h2>
      <div className="flex flex-wrap gap-2">
        {SPECIAL_CONDITIONS.map((condition) => (
          <button
            key={condition}
            onClick={() => toggle(condition)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              selected.includes(condition)
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
            }`}
          >
            {condition}
          </button>
        ))}
      </div>
    </div>
  )
}
