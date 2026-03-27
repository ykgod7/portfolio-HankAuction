'use client'

import { useState, useEffect } from 'react'
import RegionSelector from '@/components/RegionSelector'
import TypeSelector from '@/components/TypeSelector'
import PriceRangeInput from '@/components/PriceRangeInput'
import SpecialConditionSelector from '@/components/SpecialConditionSelector'
type FilterState = {
  regions: string[]
  types: string[]
  appraiseMin: number | null
  appraiseMax: number | null
  bidMin: number | null
  bidMax: number | null
  specialConditions: string[]
}

const DEFAULT_FILTER: FilterState = {
  regions: [],
  types: [],
  appraiseMin: null,
  appraiseMax: null,
  bidMin: null,
  bidMax: null,
  specialConditions: [],
}

export default function Home() {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/filters')
      const data = await res.json()
      if (data) {
        setFilter({
          regions: data.regions ?? [],
          types: data.types ?? [],
          appraiseMin: data.appraise_min ?? null,
          appraiseMax: data.appraise_max ?? null,
          bidMin: data.bid_min ?? null,
          bidMax: data.bid_max ?? null,
          specialConditions: data.special_conditions ?? [],
        })
        if (data.filter_updated_at) {
          setSavedAt(new Date(data.filter_updated_at).toLocaleString('ko-KR'))
        }
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filter),
    })
    setSaving(false)
    if (res.ok) {
      setSavedAt(new Date().toLocaleString('ko-KR'))
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">🏠 행크옥션 경매 알림</h1>
        <p className="text-sm text-gray-500 mb-8">필터를 설정하면 매주 월요일 카카오톡으로 알림을 보내드려요.</p>

        <div className="flex flex-col gap-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <RegionSelector
            selected={filter.regions}
            onChange={(regions) => setFilter({ ...filter, regions })}
          />

          <hr className="border-gray-100" />

          <TypeSelector
            selected={filter.types}
            onChange={(types) => setFilter({ ...filter, types })}
          />

          <hr className="border-gray-100" />

          <PriceRangeInput
            label="감정가"
            min={filter.appraiseMin}
            max={filter.appraiseMax}
            onChangeMin={(v) => setFilter({ ...filter, appraiseMin: v })}
            onChangeMax={(v) => setFilter({ ...filter, appraiseMax: v })}
          />

          <PriceRangeInput
            label="최저입찰가"
            min={filter.bidMin}
            max={filter.bidMax}
            onChangeMin={(v) => setFilter({ ...filter, bidMin: v })}
            onChangeMax={(v) => setFilter({ ...filter, bidMax: v })}
          />

          <hr className="border-gray-100" />

          <SpecialConditionSelector
            selected={filter.specialConditions}
            onChange={(specialConditions) => setFilter({ ...filter, specialConditions })}
          />

        </div>

        <div className="mt-4 flex items-center justify-between">
          {savedAt && (
            <p className="text-xs text-gray-400">마지막 저장: {savedAt}</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : '필터 저장'}
          </button>
        </div>
      </div>
    </main>
  )
}
