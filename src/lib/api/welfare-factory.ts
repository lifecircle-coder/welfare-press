import { getYouthPolicyList, getNationalWelfareList } from './publicData';
import { extractPolicyData } from './gemini';
import { adminSupabase } from '../supabaseClient';

/**
 * 전 지역(서울 25개 구)에 대해 정책 데이터를 수집하고 AI로 정제하여 DB에 저장합니다.
 */
export async function runWelfareDataFactory() {
    console.log('🚀 Welfare Data Factory 시작...');

    // 1. 모든 자치구 정보 가져오기
    const { data: regions, error: regionError } = await adminSupabase
        .from('welfare_regions')
        .select('*');

    if (regionError || !regions) {
        console.error('지역 정보를 가져올 수 없습니다:', regionError);
        return;
    }

    // 2. 중앙 부처 및 청년 정책 수집 (샘플링)
    // 실제 운영 시에는 루프를 돌며 더 정교하게 수집 가능
    const rawPolicies = await getYouthPolicyList(1, 100); // 우선 100건만 시범 수집

    for (const raw of rawPolicies) {
        // 이미 저장된 정책인지 확인
        const { data: existing } = await adminSupabase
            .from('welfare_policies')
            .select('id')
            .eq('original_id', raw.servId)
            .maybeSingle();

        if (existing) {
            console.log(`[Skip] 이미 존재하는 정책: ${raw.servNm}`);
            continue;
        }

        // 3. Gemini AI를 활용한 데이터 정제
        console.log(`[AI Processing] 정책 정제 중: ${raw.servNm}`);
        const aiData = await extractPolicyData(
            `제목: ${raw.servNm}\n내용: ${raw.servDgst}\n기관: ${raw.jurMnofNm}`
        );

        if (!aiData) {
            console.error(`[Fail] AI 정제 실패: ${raw.servNm}`);
            continue;
        }

        // 4. DB 저장 (Policies 테이블)
        const { data: savedPolicy, error: saveError } = await adminSupabase
            .from('welfare_policies')
            .insert({
                original_id: raw.servId,
                source: raw.apiSource || 'UNKNOWN',
                category: aiData.category,
                title: aiData.title,
                original_title: raw.servNm,
                content_summary: aiData.content_summary,
                eligibility: aiData.eligibility,
                benefits: aiData.benefits,
                application_method: aiData.application_method,
                deadline_text: aiData.deadline_text,
                deadline_date: aiData.deadline_date || null,
                ai_score: aiData.ai_score
            })
            .select()
            .single();

        if (saveError || !savedPolicy) {
            console.error(`[Error] 정책 저장 실패: ${raw.servNm}`, saveError);
            continue;
        }

        // 5. 지역 매칭 (추후 정교화 필요)
        // 제목이나 기관명에 지역 이름이 포함된 경우 매핑
        for (const region of regions) {
            if (raw.servNm.includes(region.name) || raw.jurMnofNm.includes(region.name)) {
                await adminSupabase
                    .from('welfare_region_policies')
                    .insert({
                        region_id: region.id,
                        policy_id: savedPolicy.id
                    });
                console.log(`[Mapping] ${region.name} <-> ${savedPolicy.title}`);
            }
        }
    }

    console.log('✅ Welfare Data Factory 작업 완료');
}
