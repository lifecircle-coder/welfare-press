import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const API_KEY = process.env.NEXT_PUBLIC_DATA_API_KEY || '';

// 1. 한국사회보장정보원_중앙부처복지서비스
const NATIONAL_API_URL = 'http://apis.data.go.kr/B554287/NationalWelfareInformationsV001';

// 2. 한국사회보장정보원_자원정보서비스 (시설, 노인일자리 등)
const RESOURCE_API_URL = 'https://apis.data.go.kr/B554287/resrceInfoInqireService';

// 3. 행정안전부_보조금24 (오픈API 포털 버전)
const SUBSIDY_API_URL = 'https://api.odcloud.kr/api/gov24/v3';

// 4. 온라인청년센터_청년정책_API
const YOUTH_API_URL = 'https://www.youthcenter.go.kr/opi/youthPcyList.do';
const YOUTH_API_KEY = process.env.NEXT_PUBLIC_YOUTH_API_KEY || '35661a33777592868175d717'; // 기본값은 샘플키

// 5. 여성가족부_정책뉴스 (복구)
const MOGEF_API_URL = 'http://apis.data.go.kr/1383000/mogefNew';

// 4. 한국사회보장정보원_지자체복지서비스
const LOCAL_API_URL = 'http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations';

const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: '_text',
});

// Mock 데이터 스위치
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// --- 인터페이스 정의 ---
export interface WelfareService {
    servId: string;
    servNm: string;         // 서비스명 (제목)
    jurMnofNm: string;      // 소관부처명
    servDgst: string;       // 서비스 요약
    servDtlLink: string;    // 상세 링크
    // 상세조회 시 추가되는 필드
    trgterIndvdlArray?: string; // 지원대상 (핵심)
    slctCritCn?: string;     // 선정기준 (핵심)
    alwServCn?: string;      // 급여서비스 내용
    svcfrstRegTs?: string;   // 서비스 등록 일자 (YYYYMMDD 형식 등)
    apiSource?: 'NATIONAL' | 'LOCAL' | 'SUBSIDY' | 'YOUTH' | 'MOGEF'; // 출처 배지
}

export interface ResourceService {
    fcltNm: string;          // 시설/기관명
    svcNm: string;           // 서비스명
    sidoNm: string;
    sggNm: string;
    rprsNm?: string;         // 대표자명 (상세)
    telNo?: string;          // 전화번호 (상세)
}

// --- API 호출 함수 ---

/**
 * [1순위/2순위] 중앙부처/지자체 복지서비스 목록 조회
 */
export const getNationalWelfareList = async (pageNo = 1, numOfRows = 10, searchKeyword = ''): Promise<WelfareService[]> => {
    if (USE_MOCK_DATA) {
        return getMockNationalData();
    }

    try {
        // API 자체 정렬옵션이 없으므로, 최대한 최신 데이터를 가져오기 위해 500건을 한 번에 가져와 클라이언트 측에서 정렬해야 함
        const response = await axios.get(`${NATIONAL_API_URL}/NationalWelfarelistV001`, {
            params: {
                serviceKey: decodeURIComponent(API_KEY),
                callTp: 'L',
                pageNo: 1, // 항상 1페이지부터
                numOfRows: 500,
                srchKeyCode: '003',
                searchWrd: searchKeyword || '지원금', // '지원'보다는 '지원금', '수당' 등으로 필터링 유도
            }
        });

        const jsonObj = parser.parse(response.data);
        const servList = jsonObj.wantedList?.servList;

        if (!servList) return [];
        // 단건일 경우 객체로 반환되므로 배열로 맞춤
        let arrayList = Array.isArray(servList) ? servList : [servList];

        let mappedList = arrayList.map(item => ({
            ...item,
            apiSource: 'NATIONAL' as const
        }));

        // 날짜가 있는 최신 정책부터 내림차순 정렬 (2025 가장 최상단)
        mappedList.sort((a, b) => {
            const dateA = String(a.svcfrstRegTs || '');
            const dateB = String(b.svcfrstRegTs || '');
            return dateB.localeCompare(dateA);
        });

        // 가장 최신의 50건만 잘라서 반환
        return mappedList.slice(0, 50);

    } catch (error) {
        console.error('API Fetch Error (National Welfare List):', error);
        return [];
    }
};

/**
 * [1순위] 중앙부처 복지서비스 상세 조회 (AI 기사 작성용 핵심 데이타 추출)
 */
export const getNationalWelfareDetail = async (servId: string): Promise<WelfareService | null> => {
    if (USE_MOCK_DATA) return null; // Mock에서는 리스트 데이터만 활용 권장

    try {
        const response = await axios.get(`${NATIONAL_API_URL}/NationalWelfaredetailedV001`, {
            params: {
                serviceKey: decodeURIComponent(API_KEY),
                callTp: 'D',
                servId,
            }
        });

        const jsonObj = parser.parse(response.data);
        // 실제 응답 구조 확인 필요 (가이드 기반 추정)
        const detail = jsonObj.wantedDtl;
        return detail ? (detail as WelfareService) : null;

    } catch (error) {
        console.error(`API Fetch Error (Detail, ID: ${servId}):`, error);
        return null;
    }
}

/**
 * [2순위] 지자체 복지서비스 목록 조회 (최신순 arrgOrd=001)
 */
export const getLocalGovWelfareList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    if (USE_MOCK_DATA) return [];
    try {
        const response = await axios.get(`${LOCAL_API_URL}/LcgvWelfarelist`, {
            params: {
                serviceKey: decodeURIComponent(API_KEY),
                callTp: 'L',
                pageNo,
                numOfRows,
                arrgOrd: '001', // 001: 최신순
            }
        });

        // If already JSON, use it directly. Otherwise, parse from XML.
        const jsonObj = typeof response.data === 'object' ? response.data : parser.parse(response.data);
        const servList = jsonObj.wantedList?.servList || jsonObj.servList || jsonObj.data;

        if (!servList) return [];
        let arrayList = Array.isArray(servList) ? servList : [servList];

        const mappedList: WelfareService[] = arrayList.map(item => ({
            servId: item.servId,
            servNm: item.servNm,
            jurMnofNm: `${item.ctpvNm || ''} ${item.sggNm || ''}`.trim() || item.bizChrDeptNm || '지자체',
            servDgst: item.servDgst,
            servDtlLink: '', // 목록에는 제공되지 않음
            svcfrstRegTs: '', // 목록에는 날짜가 없으므로 공란 처리
            apiSource: 'LOCAL'
        }));

        return mappedList;
    } catch (error) {
        console.error('API Fetch Error (Local Gov List):', error);
        return [];
    }
};

/**
 * [2순위] 지자체 복지서비스 상세 조회 (프롬프트 복사용)
 */
export const getLocalGovWelfareDetail = async (servId: string): Promise<WelfareService | null> => {
    if (USE_MOCK_DATA) return null;
    try {
        const response = await axios.get(`${LOCAL_API_URL}/LcgvWelfaredetailed`, {
            params: {
                serviceKey: decodeURIComponent(API_KEY),
                callTp: 'D',
                servId,
            }
        });

        const jsonObj = typeof response.data === 'object' ? response.data : parser.parse(response.data);
        const detail = jsonObj.wantedDtl || jsonObj.data;
        if (!detail) return null;

        return {
            servId: detail.servId,
            servNm: detail.servNm,
            jurMnofNm: `${detail.ctpvNm || ''} ${detail.sggNm || ''}`.trim() || detail.bizChrDeptNm || '지자체',
            servDgst: detail.servDgst,
            servDtlLink: '',
            trgterIndvdlArray: detail.trgterIndvdlNmArray || '',
            slctCritCn: detail.slctCritCn || '',
            alwServCn: detail.alwServCn || detail.sprtTrgtCn || '',
            svcfrstRegTs: detail.lastModYmd || '',
            apiSource: 'LOCAL'
        };
    } catch (error) {
        console.error(`API Fetch Error (Local Gov Detail, ID: ${servId}):`, error);
        return null;
    }
};


/**
 * [3순위] 자원정보서비스 조회 (노인일자리, 시설 등)
 */
export const getResourceInfoList = async (pageNo = 1, numOfRows = 10): Promise<ResourceService[]> => {
    if (USE_MOCK_DATA) {
        return getMockResourceData();
    }

    try {
        const response = await axios.get(`${RESOURCE_API_URL}/getPrvateResrcInfoInqire`, {
            params: {
                ServiceKey: decodeURIComponent(API_KEY), // 자원정보는 S가 대문자
                pageNo,
                numOfRows
            }
        });

        const jsonObj = parser.parse(response.data);
        const list = jsonObj.response?.body?.items?.item;

        if (!list) return [];
        return Array.isArray(list) ? list : [list];

    } catch (error) {
        console.error('API Fetch Error (Resource Info List):', error);
        return [];
    }
}

/**
 * [수정] 보조금24 목록 조회 (행정안전부 ODCloud 버전)
 */
export const getSubsidy24List = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        const response = await axios.get(`${SUBSIDY_API_URL}/serviceList`, {
            params: {
                serviceKey: decodeURIComponent(API_KEY),
                page: pageNo,
                perPage: numOfRows,
            }
        });

        // ODCloud API는 보통 JSON을 바로 반환하며 data 필드에 리스트가 있음
        const list = response.data?.data;

        if (!list) return [];
        let arrayList = Array.isArray(list) ? list : [list];

        return arrayList.map(item => ({
            servId: String(item.svcId),
            servNm: item.svcNm,
            jurMnofNm: item.pdeptNm || item.porgNm || '보조금24',
            servDgst: item.svcContent || '',
            servDtlLink: '',
            svcfrstRegTs: item.regDt?.replace(/-/g, '') || '',
            apiSource: 'SUBSIDY'
        }));
    } catch (error) {
        console.error('API Fetch Error (Subsidy24):', error);
        return [];
    }
};

/**
 * [신규] 청년정책 목록 조회 (온라인청년센터)
 */
export const getYouthPolicyList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        const response = await axios.get(YOUTH_API_URL, {
            params: {
                openApiVlak: YOUTH_API_KEY,
                pageIndex: pageNo,
                display: numOfRows,
                query: '수당'
            }
        });
        const jsonObj = parser.parse(response.data);
        const list = jsonObj.youthPolicyList?.youthPolicy;

        if (!list) return [];
        let arrayList = Array.isArray(list) ? list : [list];

        return arrayList.map(item => ({
            servId: item.bizId,
            servNm: item.polyBizSjnm,
            jurMnofNm: item.polyBizTy || '청년정책',
            servDgst: item.polyItcnCn || '',
            servDtlLink: '',
            svcfrstRegTs: '',
            apiSource: 'YOUTH'
        }));
    } catch (error) {
        console.error('API Fetch Error (Youth Policy):', error);
        return [];
    }
};

/**
 * [복구] 여성가족부 정책뉴스 조회 서비스
 */
export const getMogefNewsList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        const response = await axios.get(`${MOGEF_API_URL}/nwEnwSelectList`, {
            params: {
                serviceKey: decodeURIComponent(API_KEY),
                pageNo,
                numOfRows,
                type: 'xml'
            }
        });
        const jsonObj = parser.parse(response.data);
        const list = jsonObj.response?.body?.items?.item;

        if (!list) return [];
        let arrayList = Array.isArray(list) ? list : [list];

        const mappedList: WelfareService[] = arrayList.map(item => ({
            servId: `MOGEF_${item.bbtSn || Math.random().toString(36).substring(7)}`,
            servNm: item.title,
            jurMnofNm: '여성가족부',
            servDgst: '',
            servDtlLink: item.viewUrl,
            svcfrstRegTs: item.regDt ? item.regDt.replace(/-/g, '') : '',
            apiSource: 'MOGEF'
        }));

        return mappedList;
    } catch (error) {
        console.error('API Fetch Error (MOGEF):', error);
        return [];
    }
};


// --- Mock Data ---
export const getMockNationalData = (): WelfareService[] => {
    return [
        {
            servId: 'WLF00001001',
            servNm: '노인일자리 및 사회활동 지원사업',
            jurMnofNm: '보건복지부',
            servDgst: '어르신이 활기차고 건강한 노후생활을 영위할 수 있도록 다양한 일자리와 사회활동을 지원합니다.',
            servDtlLink: '#',
            trgterIndvdlArray: '만 65세 이상 기초연금수급자',
            slctCritCn: '소득인정액이 일정 기준 이하인 노인. 지자체별 상이함.',
            svcfrstRegTs: '20230101'
        },
        {
            servId: 'WLF00001002',
            servNm: '청년내일저축계좌',
            jurMnofNm: '보건복지부',
            servDgst: '청년이 사회에 안착할 수 있도록 자산형성을 지원합니다.',
            servDtlLink: '#',
            trgterIndvdlArray: '만 19세 ~ 34세 청년 중 소득 기준 충족자',
            slctCritCn: '기준 중위소득 100% 이하인 가구의 청년',
            svcfrstRegTs: '20230510'
        }
    ];
};

export const getMockResourceData = (): ResourceService[] => {
    return [
        {
            fcltNm: '종로시니어클럽',
            svcNm: '노인일자리 알선',
            sidoNm: '서울특별시',
            sggNm: '종로구',
            rprsNm: '김시니어',
            telNo: '02-1234-5678'
        },
        {
            fcltNm: '강남구 치매안심센터',
            svcNm: '치매예방상담',
            sidoNm: '서울특별시',
            sggNm: '강남구',
        }
    ];
};
