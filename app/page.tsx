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
  const [toast, setToast] = useState<'success' | 'error' | null>(null)

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
      const now = new Date().toLocaleString('ko-KR')
      setSavedAt(now)
      setToast('success')
      setTimeout(() => setToast(null), 3000)
    } else {
      setToast('error')
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
          toast === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast === 'success' ? '✓ 필터가 저장되었습니다' : '✗ 저장에 실패했습니다'}
        </div>
      )}

      {/* Header */}
      <div className="bg-linear-to-br from-blue-700 to-blue-500 px-4 pt-10 pb-14">
        <div className="max-w-2xl mx-auto">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">Auction Alert</p>
          <h1 className="text-2xl font-bold text-white mb-1">행크옥션 경매 알림</h1>
          <p className="text-blue-100 text-sm">필터를 설정하면 매주 월요일 카카오톡으로 알림을 보내드려요.</p>
          {savedAt && (
            <p className="text-blue-200 text-xs mt-3">마지막 저장: {savedAt}</p>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-28 flex flex-col gap-3">

        <Section label="📍 지역">
          <RegionSelector
            selected={filter.regions}
            onChange={(regions) => setFilter({ ...filter, regions })}
          />
        </Section>

        <Section label="🏢 물건 종류">
          <TypeSelector
            selected={filter.types}
            onChange={(types) => setFilter({ ...filter, types })}
          />
        </Section>

        <Section label="💰 가격 범위">
          <div className="flex flex-col gap-4">
            <PriceRangeInput
              label="감정가"
              min={filter.appraiseMin}
              max={filter.appraiseMax}
              onChangeMin={(v) => setFilter({ ...filter, appraiseMin: v })}
              onChangeMax={(v) => setFilter({ ...filter, appraiseMax: v })}
            />
            <div className="border-t border-slate-100" />
            <PriceRangeInput
              label="최저입찰가"
              min={filter.bidMin}
              max={filter.bidMax}
              onChangeMin={(v) => setFilter({ ...filter, bidMin: v })}
              onChangeMax={(v) => setFilter({ ...filter, bidMax: v })}
            />
          </div>
        </Section>

        <Section label="⚠️ 특수조건">
          <SpecialConditionSelector
            selected={filter.specialConditions}
            onChange={(specialConditions) => setFilter({ ...filter, specialConditions })}
          />
        </Section>

      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : '필터 저장'}
          </button>
        </div>
      </div>

    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <p className="text-sm font-bold text-slate-700 mb-4">{label}</p>
      {children}
    </div>
  )
}
