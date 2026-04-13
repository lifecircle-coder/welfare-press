// src/lib/welfare-data.ts
// 목적: pSEO 페이지 생성용 정적 데이터. 외부 API 의존성 없음.

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

// 핵심 정책 3가지 정의
export const WELFARE_POLICIES: WelfarePolicyData[] = [
  {
    slug: 'youth-rent-support',
    policyName: '청년 월세 한시 특별지원',
    category: '주거',
    targetAge: '19~34세',
    maxAmount: 2400000,      // 연 240만원
    monthlyAmount: 200000,   // 월 20만원
    description: '청년 월세 한시 특별지원은 19세 이상 34세 이하 청년을 대상으로 월 최대 20만원씩 최장 12개월 동안 월세를 지원하는 정부 복지 사업입니다. 독립 거주 청년의 주거비 부담을 줄이고 자립을 지원하기 위해 마련된 이 정책은 소득·자산 기준을 충족하면 신청 가능합니다.',
    eligibility: [
      '연령: 신청일 기준 19세 이상 ~ 34세 이하',
      '소득: 중위소득 60% 이하 (1인 가구 기준 월 약 134만원)',
      '자산: 본인 명의 부동산 없음 (무주택자)',
      '주거: 보증금 5천만원 이하, 월세 70만원 이하의 임차주택 거주',
      '독립가구: 부모와 별도 거주 중인 경우',
    ],
    applicationUrl: 'https://bokjiro.go.kr',
    deadline: '상시 (예산 소진 시 조기 마감)',
    documentRequired: ['임대차계약서', '주민등록등본', '소득 증빙 서류', '통장 사본'],
  },
  {
    slug: 'youth-savings-account',
    policyName: '청년 내일저축계좌',
    category: '금융',
    targetAge: '19~34세',
    maxAmount: 14400000,     // 3년 만기 정부지원 최대치
    monthlyAmount: 30000,    // 정부 월 지원 (본인 저축에 추가)
    description: '청년 내일저축계좌는 저소득 청년이 월 10만원씩 저축하면 정부가 소득 수준에 따라 월 10만원 또는 30만원을 추가 지원해주는 자산 형성 복지 사업입니다. 3년 만기 시 최대 1,440만원(정부 지원 최대치 기준)의 목돈을 마련할 수 있습니다.',
    eligibility: [
      '연령: 19세 이상 ~ 34세 이하 (수급자·차상위 15~39세)',
      '소득: 근로·사업소득 월 50만원 초과, 기준 중위소득 100% 이하',
      '가구: 수급자, 차상위, 차차상위 가구 우선',
      '본인 저축: 매월 10만원 납입 의무',
      '계좌 유지: 3년 이상 유지 조건',
    ],
    applicationUrl: 'https://bokjiro.go.kr',
    deadline: '연 1회 모집 (보통 5~6월)',
    documentRequired: ['주민등록등본', '건강보험료 납부확인서', '소득 증빙', '통장 사본'],
  },
  {
    slug: 'earned-income-tax-credit',
    policyName: '근로장려금',
    category: '생활',
    targetAge: '전 연령',
    maxAmount: 3300000,      // 단독가구 최대 165만원 → 맞벌이 최대 330만원
    monthlyAmount: 275000,   // 월 환산 기준
    description: '근로장려금은 열심히 일하지만 소득이 낮은 근로자·사업자 가구에 장려금을 지급하여 실질 소득을 높여주는 세금 환급형 복지 제도입니다. 단독 가구 기준 연 최대 165만원, 홑벌이 기준 285만원, 맞벌이 기준 330만원까지 지급됩니다. 별도 신청이 필요하며 매년 5월에 정기 신청이 가능합니다.',
    eligibility: [
      '근로소득자 또는 사업소득자',
      '단독가구: 연간 소득 2,200만원 미만',
      '홑벌이 가구: 연간 소득 3,200만원 미만',
      '맞벌이 가구: 연간 소득 3,800만원 미만',
      '재산 합계 2억 4천만원 미만 (부채 제외)',
    ],
    applicationUrl: 'https://hometax.go.kr',
    deadline: '정기: 매년 5월 1일~31일 / 반기: 상·하반기',
    documentRequired: ['주민등록등본', '금융정보 동의 (홈택스 신청 시 자동)'],
  },
];

// 파일럿 대상 20개 지역 (검색량 상위 지역 선별)
export const TARGET_REGIONS = [
  { name: '서울', code: 'seoul', population: 9700000 },
  { name: '수원', code: 'suwon', population: 1200000 },
  { name: '부산', code: 'busan', population: 3400000 },
  { name: '인천', code: 'incheon', population: 3000000 },
  { name: '대구', code: 'daegu', population: 2400000 },
  { name: '대전', code: 'daejeon', population: 1470000 },
  { name: '광주', code: 'gwangju', population: 1450000 },
  { name: '울산', code: 'ulsan', population: 1100000 },
  { name: '성남', code: 'seongnam', population: 960000 },
  { name: '고양', code: 'goyang', population: 1080000 },
  { name: '용인', code: 'yongin', population: 1090000 },
  { name: '창원', code: 'changwon', population: 1040000 },
  { name: '전주', code: 'jeonju', population: 650000 },
  { name: '제주', code: 'jeju', population: 695000 },
  { name: '청주', code: 'cheongju', population: 860000 },
  { name: '천안', code: 'cheonan', population: 670000 },
  { name: '안산', code: 'ansan', population: 660000 },
  { name: '남양주', code: 'namyangju', population: 750000 },
  { name: '화성', code: 'hwaseong', population: 900000 },
  { name: '안양', code: 'anyang', population: 540000 },
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
  for (const region of TARGET_REGIONS) {
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
