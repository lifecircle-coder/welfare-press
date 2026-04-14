// src/lib/welfare-data.ts
// 목적: pSEO 페이지 생성용 정적 데이터. 60개 하이퍼-로컬 타겟팅.

export interface WelfarePolicyData {
  slug: string;           // URL 슬러그 (영문)
  policyName: string;     // 정책명 (한글)
  category: string;       // 카테고리 (주거, 금융 등)
  targetAge: string;      // 지원 대상 연령 (예: "19~34세")
  maxAmount: number;      // 최대 지원금액 (원 단위)
  monthlyAmount: number;  // 월 지원금액 (원 단위)
  description: string;    // 정책 설명 (300자 이상)
  eligibility: string[];  // 수혜 조건 목록
  applicationUrl: string; // 신청 공홈 URL
  deadline: string;       // 신청 기한 (예: "상시", "2025.12.31")
  documentRequired: string[]; // 필요 서류
}

export interface RegionData {
  name: string;           // 지역명 (구/시 단위)
  city: string;           // 상위 시/도 명
  code: string;           // URL용 영문 코드 (예: "gwanak-gu")
  zipCd: string;          // 온라인청년센터 API 필터링용 시/도 코드
  sggCd?: string;         // 기초자치단체 코드 (필요 시)
  phone: string;          // 해당 구청/시청 담당 부서 연락처
  tailKeywords: string[]; // SEO 롱테일 키워드
}

// 2026 킬러 콘텐츠 대상: 청년월세지원 단일 정책 집중
export const WELFARE_POLICIES: WelfarePolicyData[] = [
  {
    slug: 'youth-rent-support',
    policyName: '청년 월세 한시 특별지원',
    category: '주거',
    targetAge: '19~34세',
    maxAmount: 2400000,
    monthlyAmount: 200000,
    description: '청년 월세 한시 특별지원은 19세 이상 34세 이하 청년을 대상으로 월 최대 20만원씩 최장 12개월 동안 월세를 지원하는 정부 복지 사업입니다. 최근 고물가와 고금리로 인해 주거비 부담을 느끼는 청년들을 위해 마련되었으며, 소득 및 자산 기준을 충족하면 신청 가능합니다. 특히 지자체별로 추가 지원 사업이 있을 수 있으니 내 동네 정보를 반드시 확인하세요.',
    eligibility: [
      '연령: 만 19세 ~ 34세 이하 (신청 시점 기준)',
      '소득: 원가구 기준 중위소득 100% 이하 & 청년가구 기준 중위소득 60% 이하',
      '자산: 원가구 4억 7천만원 이하 & 청년가구 1억 2,200만원 이하',
      '임차보증금 5,000만원 이하 및 월세 70만원 이하 주택 거주',
      '청약저축 가입 필수 (가입 후 신청 가능)',
    ],
    applicationUrl: 'https://www.bokjiro.go.kr',
    deadline: '2025년 12월 31일 (한시 배정)',
    documentRequired: ['임대차계약서', '주민등록등본', '소득 및 재산 증빙서류', '청약저축 가입확인서'],
  }
];

// 60개 핵심 지역 데이터 (서울 25개 구 + 경기 20개 시 + 주요 광역시 구)
export const TARGET_REGIONS: RegionData[] = [
  // --- 서울특별시 (25개 구) ---
  { name: '관악구', city: '서울', code: 'gwanak-gu', zipCd: '11000', phone: '02-879-5912', tailKeywords: ['관악구 청년월세지원', '관악구 청년 정책', '관악구 이사비 지원'] },
  { name: '강남구', city: '서울', code: 'gangnam-gu', zipCd: '11000', phone: '02-3423-5917', tailKeywords: ['강남구 청년월세지원', '강남구 복지 혜택', '강남구 청년 주거'] },
  { name: '송파구', city: '서울', code: 'songpa-gu', zipCd: '11000', phone: '02-2147-3800', tailKeywords: ['송파구 청년월세지원', '송파구 청년 일자리', '송파구 복지'] },
  { name: '강서구', city: '서울', code: 'gangseo-gu', zipCd: '11000', phone: '02-2600-6715', tailKeywords: ['강서구 청년월세지원', '강서구 주거 지원'] },
  { name: '노원구', city: '서울', code: 'nowon-gu', zipCd: '11000', phone: '02-2116-3720', tailKeywords: ['노원구 청년월세지원', '노원구 청년 정책'] },
  { name: '은평구', city: '서울', code: 'eunpyeong-gu', zipCd: '11000', phone: '02-351-6312', tailKeywords: ['은평구 청년월세지원', '은평구 청년 공간'] },
  { name: '강동구', city: '서울', code: 'gangdong-gu', zipCd: '11000', phone: '02-3425-5070', tailKeywords: ['강동구 청년월세지원', '강동구 복지'] },
  { name: '양천구', city: '서울', code: 'yangcheon-gu', zipCd: '11000', phone: '02-2620-3079', tailKeywords: ['양천구 청년월세지원'] },
  { name: '성북구', city: '서울', code: 'seongbuk-gu', zipCd: '11000', phone: '02-2241-2673', tailKeywords: ['성북구 청년월세지원'] },
  { name: '구로구', city: '서울', code: 'guro-gu', zipCd: '11000', phone: '02-860-2080', tailKeywords: ['구로구 청년월세지원'] },
  { name: '서초구', city: '서울', code: 'seocho-gu', zipCd: '11000', phone: '02-2155-8240', tailKeywords: ['서초구 청년월세지원'] },
  { name: '영등포구', city: '서울', code: 'yeongdeungpo-gu', zipCd: '11000', phone: '02-2670-3840', tailKeywords: ['영등포구 청년월세지원'] },
  { name: '동작구', city: '서울', code: 'dongjak-gu', zipCd: '11000', phone: '02-820-1692', tailKeywords: ['동작구 청년월세지원'] },
  { name: '중랑구', city: '서울', code: 'jungnag-gu', zipCd: '11000', phone: '02-2094-2270', tailKeywords: ['중랑구 청년월세지원'] },
  { name: '마포구', city: '서울', code: 'mapo-gu', zipCd: '11000', phone: '02-3153-8440', tailKeywords: ['마포구 청년월세지원'] },
  { name: '서대문구', city: '서울', code: 'seodaemun-gu', zipCd: '11000', phone: '02-330-1094', tailKeywords: ['서대문구 청년월세지원'] },
  { name: '동대문구', city: '서울', code: 'dongdaemun-gu', zipCd: '11000', phone: '02-2127-4540', tailKeywords: ['동대문구 청년월세지원'] },
  { name: '광진구', city: '서울', code: 'gwangjin-gu', zipCd: '11000', phone: '02-450-7040', tailKeywords: ['광진구 청년월세지원'] },
  { name: '강북구', city: '서울', code: 'gangbuk-gu', zipCd: '11000', phone: '02-901-2532', tailKeywords: ['강북구 청년월세지원'] },
  { name: '성동구', city: '서울', code: 'seongdong-gu', zipCd: '11000', phone: '02-2286-5480', tailKeywords: ['성동구 청년월세지원'] },
  { name: '용산구', city: '서울', code: 'yongsan-gu', zipCd: '11000', phone: '02-2199-6520', tailKeywords: ['용산구 청년월세지원'] },
  { name: '금천구', city: '서울', code: 'geumcheon-gu', zipCd: '11000', phone: '02-2627-2422', tailKeywords: ['금천구 청년월세지원'] },
  { name: '도봉구', city: '서울', code: 'dobong-gu', zipCd: '11000', phone: '02-2019-3210', tailKeywords: ['도봉구 청년월세지원'] },
  { name: '종로구', city: '서울', code: 'jongno-gu', zipCd: '11000', phone: '02-2148-1800', tailKeywords: ['종로구 청년월세지원'] },
  { name: '중구', city: '서울', code: 'jung-gu', zipCd: '11000', phone: '02-3396-4170', tailKeywords: ['서울 중구 청년월세지원'] },

  // --- 경기도 (20개 도시) ---
  { name: '수원시', city: '경기', code: 'suwon', zipCd: '41000', phone: '1899-3300', tailKeywords: ['수원시 청년월세지원', '수원 청년 정책'] },
  { name: '성남시', city: '경기', code: 'seongnam', zipCd: '41000', phone: '031-729-8750', tailKeywords: ['성남시 청년월세지원', '성남 청년 배당'] },
  { name: '고양시', city: '경기', code: 'goyang', zipCd: '41000', phone: '031-8075-2720', tailKeywords: ['고양시 청년월세지원'] },
  { name: '용인시', city: '경기', code: 'yongin', zipCd: '41000', phone: '031-324-2790', tailKeywords: ['용인시 청년월세지원'] },
  { name: '부천시', city: '경기', code: 'bucheon', zipCd: '41000', phone: '032-625-2990', tailKeywords: ['부천시 청년월세지원'] },
  { name: '안산시', city: '경기', code: 'ansan', zipCd: '41000', phone: '031-481-2290', tailKeywords: ['안산시 청년월세지원'] },
  { name: '남양주시', city: '경기', code: 'namyangju', zipCd: '41000', phone: '031-590-8510', tailKeywords: ['남양주시 청년월세지원'] },
  { name: '안양시', city: '경기', code: 'anyang', zipCd: '41000', phone: '031-8045-5780', tailKeywords: ['안양시 청년월세지원'] },
  { name: '화성시', city: '경기', code: 'hwaseong', zipCd: '41000', phone: '031-5189-3290', tailKeywords: ['화성시 청년월세지원'] },
  { name: '평택시', city: '경기', code: 'pyeongtaek', zipCd: '41000', phone: '031-8024-3070', tailKeywords: ['평택시 청년월세지원'] },
  { name: '의정부시', city: '경기', code: 'uijeongbu', zipCd: '41000', phone: '031-828-2100', tailKeywords: ['의정부시 청년월세지원'] },
  { name: '시흥시', city: '경기', code: 'siheung', zipCd: '41000', phone: '031-310-3690', tailKeywords: ['시흥시 청년월세지원'] },
  { name: '파주시', city: '경기', code: 'paju', zipCd: '41000', phone: '031-940-4114', tailKeywords: ['파주시 청년월세지원'] },
  { name: '김포시', city: '경기', code: 'gimpo', zipCd: '41000', phone: '031-980-2114', tailKeywords: ['김포시 청년월세지원'] },
  { name: '광명시', city: '경기', code: 'gwangmyeong', zipCd: '41000', phone: '02-2680-2114', tailKeywords: ['광명시 청년월세지원'] },
  { name: '군포시', city: '경기', code: 'gunpo', zipCd: '41000', phone: '031-390-0114', tailKeywords: ['군포시 청년월세지원'] },
  { name: '하남시', city: '경기', code: 'hanam', zipCd: '41000', phone: '031-790-6114', tailKeywords: ['하남시 청년월세지원'] },
  { name: '오산시', city: '경기', code: 'osan', zipCd: '41000', phone: '031-8036-7114', tailKeywords: ['오산시 청년월세지원'] },
  { name: '이천시', city: '경기', code: 'icheon', zipCd: '41000', phone: '031-644-2000', tailKeywords: ['이천시 청년월세지원'] },
  { name: '안성시', city: '경기', code: 'anseong', zipCd: '41000', phone: '031-678-2114', tailKeywords: ['안성시 청년월세지원'] },

  // --- 부산광역시 (10개 구/군) ---
  { name: '해운대구', city: '부산', code: 'haeundae', zipCd: '26000', phone: '051-749-4000', tailKeywords: ['해운대구 청년월세지원'] },
  { name: '부산진구', city: '부산', code: 'busanjin', zipCd: '26000', phone: '051-605-4000', tailKeywords: ['부산진구 청년월세지원'] },
  { name: '남구', city: '부산', code: 'nam-gu-busan', zipCd: '26000', phone: '051-607-4000', tailKeywords: ['부산 남구 청년월세지원'] },
  { name: '북구', city: '부산', code: 'buk-gu-busan', zipCd: '26000', phone: '051-309-4000', tailKeywords: ['부산 북구 청년월세지원'] },
  { name: '동래구', city: '부산', code: 'dongnae', zipCd: '26000', phone: '051-550-4000', tailKeywords: ['동래구 청년월세지원'] },
  { name: '사하구', city: '부산', code: 'saha', zipCd: '26000', phone: '051-220-4000', tailKeywords: ['사하구 청년월세지원'] },
  { name: '금정구', city: '부산', code: 'geumjeong', zipCd: '26000', phone: '051-519-4000', tailKeywords: ['금정구 청년월세지원'] },
  { name: '연제구', city: '부산', code: 'yeonje', zipCd: '26000', phone: '051-665-4000', tailKeywords: ['연제구 청년월세지원'] },
  { name: '수영구', city: '부산', code: 'suyeong', zipCd: '26000', phone: '051-610-4000', tailKeywords: ['수영구 청년월세지원'] },
  { name: '사상구', city: '부산', code: 'sasang', zipCd: '26000', phone: '051-310-4000', tailKeywords: ['사상구 청년월세지원'] },

  // --- 기타 광역시 핵심 구 (5개) ---
  { name: '부평구', city: '인천', code: 'bupyeong', zipCd: '28000', phone: '032-509-6114', tailKeywords: ['인천 부평구 청년월세지원'] },
  { name: '수성구', city: '대구', code: 'suseong', zipCd: '27000', phone: '053-666-2000', tailKeywords: ['대구 수성구 청년월세지원'] },
  { name: '유성구', city: '대전', code: 'yuseong', zipCd: '30000', phone: '042-611-2114', tailKeywords: ['대전 유성구 청년월세지원'] },
  { name: '광산구', city: '광주', code: 'gwangsan', zipCd: '29000', phone: '062-960-8114', tailKeywords: ['광주 광산구 청년월세지원'] },
  { name: '남구', city: '울산', code: 'nam-gu-ulsan', zipCd: '31000', phone: '052-226-5114', tailKeywords: ['울산 남구 청년월세지원'] },
];

export function generatePSeoSlugs() {
  const results = [];
  for (const region of TARGET_REGIONS) {
    for (const policy of WELFARE_POLICIES) {
      results.push({
        slug: `${region.code}-${policy.slug}`,
        region,
        policy,
      });
    }
  }
  return results;
}

export function parsePSeoSlug(slug: string) {
  // exact region code search (reversed logic for better match)
  const sortedRegions = [...TARGET_REGIONS].sort((a, b) => b.code.length - a.code.length);
  for (const region of sortedRegions) {
    if (slug.startsWith(`${region.code}-`)) {
      const policySlug = slug.replace(`${region.code}-`, '');
      const policy = WELFARE_POLICIES.find(p => p.slug === policySlug) || null;
      return { region, policy };
    }
  }
  return { region: null, policy: null };
}

export function formatAmount(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억원`;
  if (amount >= 10000) return `${Math.floor(amount / 10000)}만원`;
  return `${amount.toLocaleString()}원`;
}
