import { supabase } from './supabaseClient';

export interface WelfareRegion {
    id: string;
    name: string;
    description: string;
    population_youth: number;
    avg_rent_officetel: number;
    keywords: string[];
}

export interface WelfarePolicy {
    id: string;
    title: string;
    category: string;
    content_summary: string;
    eligibility: string;
    benefits: string;
    application_method: string;
    deadline_text: string;
    ai_score: number;
    source: string;
}

/**
 * 슬러그로 특정 지역 정보 조회
 */
export async function getWelfareRegionBySlug(slug: string): Promise<WelfareRegion | null> {
    const { data, error } = await supabase
        .from('welfare_regions')
        .select('*')
        .eq('id', slug)
        .single();
    
    if (error) {
        console.error('Error fetching region:', error);
        return null;
    }
    return data;
}

/**
 * 특정 지역에 매칭된 정책 리스트 조회
 */
export async function getPoliciesByRegion(regionId: string): Promise<WelfarePolicy[]> {
    // 1. 지역-정책 매핑 테이블에서 정책 ID 목록 가져오기
    const { data: mappings, error: mapError } = await supabase
        .from('welfare_region_policies')
        .select('policy_id')
        .eq('region_id', regionId);

    if (mapError || !mappings) return [];

    const policyIds = mappings.map(m => m.policy_id);

    // 2. 정책 상세 정보 가져오기 (매핑된 것 + 국가 공통 정책 일부)
    const { data, error } = await supabase
        .from('welfare_policies')
        .select('*')
        .or(`id.in.(${policyIds.join(',')}),source.eq.NATIONAL`)
        .order('ai_score', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching policies:', error);
        return [];
    }
    return data;
}

/**
 * 모든 지역 슬러그 가져오기 (Static Generation용)
 */
export async function getAllRegionSlugs(): Promise<string[]> {
    const { data, error } = await supabase
        .from('welfare_regions')
        .select('id');
    
    if (error) return [];
    return data.map(r => r.id);
}
