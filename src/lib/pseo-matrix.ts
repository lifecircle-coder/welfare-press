// src/lib/pseo-matrix.ts
// THE복지 pSEO 100개 코호트 매트릭스 데이터
// 기준 소스: !![최종]THE복지 pSEO 아키텍처 및 시스템 구축 계획안

export type Situation = 'single' | 'newlywed';

export interface RegionData {
  code: string;      // URL용: "gwanak"
  name: string;      // 한글명: "관악구"
  city: string;      // 상위: "서울"
  phone: string;     // 담당 부서 직통 번호
  avgRent: number;   // 한국부동산원 2026년 1분기 기준 지역 평균 월세(원)
}

export interface SituationData {
  code: Situation;
  label: string;
  eligibility: string[];
  extraBenefits: string[];
}

export interface PolicyData {
  name: string;
  monthlyAmount: number;
  maxAmount: number;
  deadline: string;
  applicationUrl: string;
  documents: string[];
  lastUpdated: string;
}

// ─────────────────────────────────────────
// Z축 — 정책 데이터 (1개)
// ─────────────────────────────────────────
export const POLICY: PolicyData = {
  name: '청년 월세 한시 특별지원',
  monthlyAmount: 200000,
  maxAmount: 2400000,
  deadline: '2026년 12월 31일 (예산 소진 시 조기 마감)',
  applicationUrl: 'https://www.bokjiro.go.kr',
  documents: [
    '임대차계약서',
    '주민등록등본',
    '소득·재산 증빙서류',
    '청약저축 가입확인서',
  ],
  lastUpdated: '2026.04',
};

// ─────────────────────────────────────────
// Y축 — 상황 데이터 (2개)
// ─────────────────────────────────────────
export const SITUATIONS: SituationData[] = [
  {
    code: 'single',
    label: '1인 무주택 청년',
    eligibility: [
      '만 19~34세 이하 (신청일 기준)',
      '1인 가구, 무주택자',
      '원가구 기준 중위소득 100% 이하',
      '청년가구 기준 중위소득 60% 이하 (약 월 134만원)',
      '임차보증금 5천만원 이하, 월세 70만원 이하',
      '청약저축 가입 필수',
    ],
    extraBenefits: [
      '청년도약계좌 (정부 기여금 월 최대 2.4만원, 5년)',
      '청년내일저축계좌 (정부 매칭 월 10만원, 3년)',
    ],
  },
  {
    code: 'newlywed',
    label: '신혼부부',
    eligibility: [
      '혼인신고 후 7년 이내',
      '부부합산 기준 중위소득 100% 이하',
      '무주택 세대구성원',
      '임차보증금 5천만원 이하, 월세 70만원 이하',
      '청약저축 가입 필수',
    ],
    extraBenefits: [
      '신혼부부 전세자금 대출 (연 1.2~2.1% 저금리, 최대 2억)',
      '출산·양육 축하금 (지자체별 상이, 최대 수백만원)',
    ],
  },
];

// ─────────────────────────────────────────
// X축 — 지역 데이터 (50개)
// 평균 월세: 한국부동산원 2026년 1분기 기준
// ─────────────────────────────────────────
export const REGIONS: RegionData[] = [
  // 서울 25개 구
  { code: 'gwanak', name: '관악구', city: '서울', phone: '02-879-5912', avgRent: 620000 },
  { code: 'mapo', name: '마포구', city: '서울', phone: '02-3153-8440', avgRent: 750000 },
  { code: 'gangnam', name: '강남구', city: '서울', phone: '02-3423-5917', avgRent: 980000 },
  { code: 'songpa', name: '송파구', city: '서울', phone: '02-2147-3800', avgRent: 890000 },
  { code: 'gangseo', name: '강서구', city: '서울', phone: '02-2600-6715', avgRent: 650000 },
  { code: 'nowon', name: '노원구', city: '서울', phone: '02-2116-3720', avgRent: 570000 },
  { code: 'eunpyeong', name: '은평구', city: '서울', phone: '02-351-6312', avgRent: 580000 },
  { code: 'gangdong', name: '강동구', city: '서울', phone: '02-3425-5070', avgRent: 720000 },
  { code: 'yangcheon', name: '양천구', city: '서울', phone: '02-2620-3079', avgRent: 690000 },
  { code: 'seongbuk', name: '성북구', city: '서울', phone: '02-2241-2673', avgRent: 600000 },
  { code: 'guro', name: '구로구', city: '서울', phone: '02-860-2080', avgRent: 590000 },
  { code: 'seocho', name: '서초구', city: '서울', phone: '02-2155-8240', avgRent: 920000 },
  { code: 'yeongdeungpo', name: '영등포구', city: '서울', phone: '02-2670-3840', avgRent: 730000 },
  { code: 'dongjak', name: '동작구', city: '서울', phone: '02-820-1692', avgRent: 670000 },
  { code: 'jungnang', name: '중랑구', city: '서울', phone: '02-2094-2270', avgRent: 560000 },
  { code: 'seodaemun', name: '서대문구', city: '서울', phone: '02-330-1094', avgRent: 640000 },
  { code: 'dongdaemun', name: '동대문구', city: '서울', phone: '02-2127-4540', avgRent: 610000 },
  { code: 'gwangjin', name: '광진구', city: '서울', phone: '02-450-7040', avgRent: 680000 },
  { code: 'gangbuk', name: '강북구', city: '서울', phone: '02-901-2532', avgRent: 540000 },
  { code: 'seongdong', name: '성동구', city: '서울', phone: '02-2286-5480', avgRent: 760000 },
  { code: 'yongsan', name: '용산구', city: '서울', phone: '02-2199-6520', avgRent: 870000 },
  { code: 'geumcheon', name: '금천구', city: '서울', phone: '02-2627-2422', avgRent: 560000 },
  { code: 'dobong', name: '도봉구', city: '서울', phone: '02-2019-3210', avgRent: 540000 },
  { code: 'jongno', name: '종로구', city: '서울', phone: '02-2148-1800', avgRent: 780000 },
  { code: 'jung', name: '중구', city: '서울', phone: '02-3396-4170', avgRent: 810000 },

  // 경기 20개 시
  { code: 'suwon', name: '수원시', city: '경기', phone: '1899-3300', avgRent: 580000 },
  { code: 'seongnam', name: '성남시', city: '경기', phone: '031-729-8750', avgRent: 650000 },
  { code: 'goyang', name: '고양시', city: '경기', phone: '031-8075-2720', avgRent: 600000 },
  { code: 'yongin', name: '용인시', city: '경기', phone: '031-324-2790', avgRent: 590000 },
  { code: 'bucheon', name: '부천시', city: '경기', phone: '032-625-2990', avgRent: 570000 },
  { code: 'ansan', name: '안산시', city: '경기', phone: '031-481-2290', avgRent: 520000 },
  { code: 'namyangju', name: '남양주시', city: '경기', phone: '031-590-8510', avgRent: 540000 },
  { code: 'anyang', name: '안양시', city: '경기', phone: '031-8045-5780', avgRent: 560000 },
  { code: 'hwaseong', name: '화성시', city: '경기', phone: '031-5189-3290', avgRent: 550000 },
  { code: 'pyeongtaek', name: '평택시', city: '경기', phone: '031-8024-3070', avgRent: 500000 },
  { code: 'uijeongbu', name: '의정부시', city: '경기', phone: '031-828-2100', avgRent: 510000 },
  { code: 'siheung', name: '시흥시', city: '경기', phone: '031-310-3690', avgRent: 490000 },
  { code: 'paju', name: '파주시', city: '경기', phone: '031-940-4114', avgRent: 500000 },
  { code: 'gimpo', name: '김포시', city: '경기', phone: '031-980-2114', avgRent: 520000 },
  { code: 'gwangmyeong', name: '광명시', city: '경기', phone: '02-2680-2114', avgRent: 560000 },
  { code: 'gunpo', name: '군포시', city: '경기', phone: '031-390-0114', avgRent: 530000 },
  { code: 'hanam', name: '하남시', city: '경기', phone: '031-790-6114', avgRent: 590000 },
  { code: 'osan', name: '오산시', city: '경기', phone: '031-8036-7114', avgRent: 480000 },
  { code: 'icheon', name: '이천시', city: '경기', phone: '031-644-2000', avgRent: 460000 },
  { code: 'anseong', name: '안성시', city: '경기', phone: '031-678-2114', avgRent: 440000 },

  // 기타 광역시 핵심 구 5개
  { code: 'bupyeong', name: '부평구', city: '인천', phone: '032-509-6114', avgRent: 490000 },
  { code: 'suseong', name: '수성구', city: '대구', phone: '053-666-2000', avgRent: 450000 },
  { code: 'yuseong', name: '유성구', city: '대전', phone: '042-611-2114', avgRent: 430000 },
  { code: 'gwangsan', name: '광산구', city: '광주', phone: '062-960-8114', avgRent: 400000 },
  { code: 'nam-ulsan', name: '남구', city: '울산', phone: '052-226-5114', avgRent: 420000 },
];

// ─────────────────────────────────────────
// 유틸 함수
// ─────────────────────────────────────────
export function generateAllSlugs() {
  const slugs: { slug: string; region: RegionData; situation: SituationData; policy: PolicyData }[] = [];
  for (const region of REGIONS) {
    for (const situation of SITUATIONS) {
      slugs.push({
        slug: `${region.code}-${situation.code}-monthly-rent`,
        region,
        situation,
        policy: POLICY,
      });
    }
  }
  return slugs; // 100개
}

export function parseSlug(slug: string) {
  for (const region of REGIONS) {
    for (const situation of SITUATIONS) {
      const expected = `${region.code}-${situation.code}-monthly-rent`;
      if (slug === expected) return { region, situation, policy: POLICY };
    }
  }
  return null;
}

export function formatWon(amount: number): string {
  if (amount >= 10000) return `${Math.floor(amount / 10000)}만원`;
  return `${amount.toLocaleString()}원`;
}
