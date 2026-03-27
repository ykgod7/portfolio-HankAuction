import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const FIXED_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const { data, error } = await supabase
    .from('filters')
    .select('*')
    .eq('id', FIXED_ID)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? null)
}

export async function POST(req: Request) {
  const body = await req.json()

  const { error } = await supabase.from('filters').upsert({
    id: FIXED_ID,
    regions: body.regions,
    types: body.types,
    appraise_min: body.appraiseMin,
    appraise_max: body.appraiseMax,
    bid_min: body.bidMin,
    bid_max: body.bidMax,
    special_conditions: body.specialConditions,
    filter_updated_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
