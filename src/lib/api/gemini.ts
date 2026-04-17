import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface ExtractedPolicy {
    title: string;           -- 검색 최적화된 키워드 포함 제목
    category: string;        -- 주거, 일자리, 금융, 교육, 복지 등
    content_summary: string; -- MZ세대 타겟 본능적 요약 (3문장 내)
    eligibility: string;     -- 지원 대상 핵심 요약
    benefits: string;        -- 지원 혜택 핵심 요약
    application_method: string; -- 신청 방법 핵심 요약
    deadline_text: string;   -- 마감일 관련 텍스트
    deadline_date?: string;  -- YYYY-MM-DD 형식 (추출 가능 시)
    ai_score: number;        -- 1~10점 (혜택 체감도 기준)
}

/**
 * 복지 정책 원문을 분석하여 MZ 세대가 선호하는 정형화된 데이터로 변환합니다.
 */
export async function extractPolicyData(rawText: string): Promise<ExtractedPolicy | null> {
    const prompt = `
당신은 대한민국 대표 복지 포털 'THE복지'의 시니어 에디터이자 MZ세대 트렌드 전문가입니다.
다음의 공공 복지 정책 원문을 읽고, MZ세대가 검색할 만한 키워드를 포함하여 정형화된 JSON 데이터로 변환해주세요.

[규칙]
1. title: 원본 제목을 그대로 쓰지 말고, "마포구 월세 20만원 지원" 같이 핵심 혜택과 지역, 키워드가 포함된 제목으로 고쳐주세요.
2. content_summary: "이거 안 받으면 손해!", "내 돈 지키는 법" 등 MZ세대 취향의 직설적이고 본능적인 문체로 3문장 이내 요약하세요.
3. categories: [주거, 일자리, 금융, 교육, 생활, 기타] 중 하나를 선택하세요.
4. ai_score: 청년들이 느낄 실질적인 '득템' 가치를 1~10점으로 평가하세요.
5. JSON 포맷으로 응답하세요.

[원문]
${rawText}

[출력 포맷 예시]
{
  "title": "...",
  "category": "...",
  "content_summary": "...",
  "eligibility": "...",
  "benefits": "...",
  "application_method": "...",
  "deadline_text": "...",
  "deadline_date": "YYYY-MM-DD",
  "ai_score": 8
}
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // JSON 추출 로직 (Markdown 코드 블록 제거)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        
        return JSON.parse(jsonMatch[0]) as ExtractedPolicy;
    } catch (error) {
        console.error('Gemini API Error:', error);
        return null;
    }
}
