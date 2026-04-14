// src/lib/welfare-data.ts
// 목적: pSEO 페이지 생성용 정적 데이터. 60개 MVP 타겟팅.

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
  name: string;
  code: string;
  zipCd: string;          // 공공데이터 API 필터링용 코드
  tailKeywords: string[]; // SEO 롱테일 키워드
}

// 핵심 정책 3가지 정의
export const WELFARE_POLICIES: WelfarePolicyData[] = [
  {
    slug: 'youth-rent-support',
    policyName: '청년 월세 한시 특별지원',
    category: '주거',
    targetAge: '19~34세',
    maxAmount: 2400000,
    monthlyAmount: 200000,
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
    maxAmount: 14400000,
    monthlyAmount: 100000, // 추가 지원금 평균값
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
    maxAmount: 3300000,
    monthlyAmount: 275000,
    description: '근로장려금은 열심히 일하지만 소득이 낮은 근로자·사업자 가구에 장려금을 지급하여 실질 소득을 높여주는 세금 환급형 복지 제도입니다. 단독 가구 기준 연 최대 165만원, 홑벌이 기준 285만원, 맞벌이 기준 330만원까지 지급됩니다. 매년 5월 정기 신청이 가능합니다.',
    eligibility: [
      '근로소득자 또는 사업소득자',
      '단독가구: 연간 소득 2,200만원 미만',
      '홑벌이 가구: 연간 소득 3,200만원 미만',
      '맞벌이 가구: 연간 소득 3,800만원 미만',
      '재산 합계 2억 4천만원 미만 (부채 제외)',
    ],
    applicationUrl: 'https://hometax.go.kr',
    deadline: '정기: 매년 5월 / 반기: 상·하반기',
    documentRequired: ['주민등록등본', '금융정보 동의'],
  },
];

// 20개 타겟 지역 데이터 (행정동 코드 매핑)
export const TARGET_REGIONS: RegionData[] = [
  { name: '서울', code: 'seoul', zipCd: '11000', tailKeywords: ['서울 청년 월세 지원', '서울 복지 혜택', '서울시 청년 정책'] },
  { name: '수원', code: 'suwon', zipCd: '41000', tailKeywords: ['수원시 청년 지원금', '수원 월세 지원', '수원 복지 포털'] },
  { name: '부산', code: 'busan', zipCd: '26000', tailKeywords: ['부산 청년 정책', '부산시 복지 혜택', '부산 월세 지원'] },
  { name: '인천', code: 'incheon', zipCd: '28000', tailKeywords: ['인천 청년 지원금', '인천 복지 제도', '인천 월세 지원'] },
  { name: '대구', code: 'daegu', zipCd: '27000', tailKeywords: ['대구 청년 정책', '대구시 복지 혜택', '대구 월세 지원'] },
  { name: '대전', code: 'daejeon', zipCd: '30000', tailKeywords: ['대전 청년 지원금', '대전 복지 포털', '대전 월세 지원'] },
  { name: '광주', code: 'gwangju', zipCd: '29000', tailKeywords: ['광주 청년 정책', '광주광역시 복지', '광주 월세 지원'] },
  { name: '울산', code: 'ulsan', zipCd: '31000', tailKeywords: ['울산 청년 지원금', '울산 복지 혜택', '울산 월세 지원'] },
  { name: '성남', code: 'seongnam', zipCd: '41000', tailKeywords: ['성남시 청년 정책', '성남 복지 지원금', '성남 월세 지원'] },
  { name: '고양', code: 'goyang', zipCd: '41000', tailKeywords: ['고양시 청년 지원', '고양 복지 혜택', '고양 월세 지원'] },
  { name: '용인', code: 'yongin', zipCd: '41000', tailKeywords: ['용인시 청년 정책', '용인 복지 포털', '용인 월세 지원'] },
  { name: '창원', code: 'changwon', zipCd: '48000', tailKeywords: ['창원시 청년 지원금', '창원 복지 혜택', '창원 월세 지원'] },
  { name: '전주', code: 'jeonju', zipCd: '45000', tailKeywords: ['전주시 청년 정책', '전주 복지 포털', '전주 월세 지원'] },
  { name: '제주', code: 'jeju', zipCd: '50000', tailKeywords: ['제주도 청년 지원', '제주 복지 혜택', '제주 월세 지원'] },
  { name: '청주', code: 'cheongju', zipCd: '43000', tailKeywords: ['청주시 청년 정책', '청주 복지 지원금', '청주 월세 지원'] },
  { name: '천안', code: 'cheonan', zipCd: '44000', tailKeywords: ['천안시 청년 지원', '천안 복지 혜택', '천안 월세 지원'] },
  { name: '안산', code: 'ansan', zipCd: '41000', tailKeywords: ['안산시 청년 정책', '안산 복지 포털', '안산 월세 지원'] },
  { name: '남양주', code: 'namyangju', zipCd: '41000', tailKeywords: ['남양주시 청년 지원', '남양주 복지 혜택', '남양주 월세 지원'] },
  { name: '화성', code: 'hwaseong', zipCd: '41000', tailKeywords: ['화성시 청년 정책', '화성 복지 포털', '화성 월세 지원'] },
  { name: '안양', code: 'anyang', zipCd: '41000', tailKeywords: ['안양시 청년 지원금', '안양 복지 혜택', '안양 월세 지원'] },
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
