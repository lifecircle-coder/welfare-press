import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseClient';

const HOUSEHOLD_DB: Record<string, string> = {
  single: '1인가구',
  couple: '2인가구',
  family: '3인이상',
};

const INCOME_DB: Record<string, string> = {
  low: '중위60%이하',
  medium: '중위100%이하',
  high: '전체',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      situation,
      answers,
      score,
      total_questions,
      eligible_policies,
      total_benefit_amount,
    } = body;

    const sessionToken = crypto.randomUUID();
    const region = `${situation.province} ${situation.district}`;
    const householdType = HOUSEHOLD_DB[situation.householdType] ?? '1인가구';
    const incomeLevel = INCOME_DB[situation.incomeLevel] ?? '전체';

    const { data, error } = await adminSupabase.from('quiz_sessions').insert({
      session_token: sessionToken,
      region,
      age: situation.age,
      household_type: householdType,
      income_level: incomeLevel,
      status: 'completed',
      answers: answers ?? [],
      score,
      total_questions,
      eligible_policies: eligible_policies ?? [],
      total_benefit_amount: total_benefit_amount ?? 0,
      certificate_issued_at: new Date().toISOString(),
    }).select('id, session_token').single();

    if (error) {
      console.error('[quiz/session] insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session_token: data.session_token, id: data.id });
  } catch (err) {
    console.error('[quiz/session] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
