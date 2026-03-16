import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const API_KEY = process.env.NEXT_PUBLIC_DATA_API_KEY || '';
const GENERAL_API_KEY = process.env.NEXT_PUBLIC_GENERAL_DATA_API_KEY || '12b8bc4d97607f8df3a88d39efa639e76ea1668505c5762165139c7eff120944';

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

// 6. 문화체육관광부_정책브리핑
// 6. 문화체육관광부_정책브리핑 (정상 엔드포인트 1371000 계열로 통합)
const MCST_API_URL = 'http://apis.data.go.kr/1371000/pressReleaseService';

// 7. 행정안전부_보조금24_통계
const MOIS_STATS_API_URL = 'http://apis.data.go.kr/1741000/Subsidy24';

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
    apiSource?: 'NATIONAL' | 'LOCAL' | 'SUBSIDY' | 'YOUTH' | 'MOGEF' | 'MCST_PRESS' | 'MCST_NEWS' | 'MCST_PHOTO' | 'MOIS_STATS'; // 출처 배지
    // 신규 추가 필드
    isNews?: boolean;        // 뉴스/보도자료 여부
    priority?: number;       // 정렬 우선순위
    thumbnail?: string;      // 썸네일 이미지 URL
    deptNm?: string;         // 상세 부서명
    keywords?: string[];     // 추출 키워드
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
        let data;
        if (typeof window !== 'undefined') {
            // Browser env: Use proxy
            const response = await axios.get('/api/public-data', {
                params: {
                    type: 'NATIONAL_LIST',
                    searchWrd: searchKeyword
                }
            });
            data = response.data;
        } else {
            // Server env: Call direct
            const response = await axios.get(`${NATIONAL_API_URL}/NationalWelfarelistV001`, {
                params: {
                    serviceKey: decodeURIComponent(API_KEY),
                    callTp: 'L',
                    pageNo: 1,
                    numOfRows: 500, // 전체 데이터를 한 번에 가져와서 정렬
                    srchKeyCode: '003',
                    searchWrd: '', // 키워드 없이 전체 호출
                }
            });
            data = response.data;
        }

        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const servList = jsonObj.wantedList?.servList || jsonObj.response?.body?.items?.item || jsonObj.servList || jsonObj.data;

        if (!servList) {
            console.warn('No servList found for National Welfare:', jsonObj);
            return [];
        }
        let arrayList = Array.isArray(servList) ? servList : [servList];

        let mappedList = arrayList.map(item => ({
            servId: item.servId || '',
            servNm: item.servNm || '',
            jurMnofNm: item.jurMnofNm || '',
            servDgst: item.servDgst || '',
            servDtlLink: item.servDtlLink || '',
            svcfrstRegTs: item.svcfrstRegTs ? String(item.svcfrstRegTs) : '',
            apiSource: 'NATIONAL' as const,
            priority: 3,
            isNews: false
        }));

        mappedList.sort((a, b) => {
            const dateA = String(a.svcfrstRegTs || '');
            const dateB = String(b.svcfrstRegTs || '');
            return dateB.localeCompare(dateA);
        });

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
    if (USE_MOCK_DATA) return null;

    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: {
                    type: 'NATIONAL_DETAIL',
                    servId
                }
            });
            data = response.data;
        } else {
            const response = await axios.get(`${NATIONAL_API_URL}/NationalWelfaredetailedV001`, {
                params: {
                    serviceKey: decodeURIComponent(API_KEY),
                    callTp: 'D',
                    servId,
                }
            });
            data = response.data;
        }

        const jsonObj = parser.parse(data);
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
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: {
                    type: 'LOCAL_LIST',
                    pageNo,
                    numOfRows
                }
            });
            data = response.data;
        } else {
            const response = await axios.get(`${LOCAL_API_URL}/LcgvWelfarelist`, {
                params: {
                    serviceKey: decodeURIComponent(API_KEY),
                    callTp: 'L',
                    pageNo,
                    numOfRows,
                    // arrgOrd: '001' 제거 (0건 반환 이슈 해결)
                }
            });
            data = response.data;
        }

        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const servList = jsonObj.wantedList?.servList || jsonObj.servList || jsonObj.data;

        if (!servList) return [];
        let arrayList = Array.isArray(servList) ? servList : [servList];

        const mappedList: WelfareService[] = arrayList.map(item => ({
            servId: item.servId,
            servNm: item.servNm,
            jurMnofNm: `${item.ctpvNm || ''} ${item.sggNm || ''}`.trim() || item.bizChrDeptNm || '지자체',
            servDgst: item.servDgst,
            servDtlLink: '',
            svcfrstRegTs: item.lastModYmd || '', // 최신 수정일 매핑
            apiSource: 'LOCAL',
            priority: 3,
            isNews: false
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
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: {
                    type: 'LOCAL_DETAIL',
                    servId
                }
            });
            data = response.data;
        } else {
            const response = await axios.get(`${LOCAL_API_URL}/LcgvWelfaredetailed`, {
                params: {
                    serviceKey: decodeURIComponent(API_KEY),
                    callTp: 'D',
                    servId,
                }
            });
            data = response.data;
        }

        const jsonObj = typeof data === 'object' ? data : parser.parse(data);
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
        let list;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: {
                    type: 'SUBSIDY_LIST',
                    pageNo,
                    numOfRows
                }
            });
            list = response.data?.data;
        } else {
            const response = await axios.get(`${SUBSIDY_API_URL}/serviceList`, {
                params: {
                    serviceKey: decodeURIComponent(API_KEY),
                    page: pageNo,
                    perPage: numOfRows,
                }
            });
            list = response.data?.data || response.data?.item || response.data;
        }

        if (!list) return [];
        let arrayList = Array.isArray(list) ? list : (list.item ? (Array.isArray(list.item) ? list.item : [list.item]) : [list]);

        // 데이터가 실제 오브젝트 배열인지 확인 (500 에러 방지)
        if (arrayList.length > 0 && typeof arrayList[0] !== 'object') {
            return [];
        }

        return arrayList.map(item => ({
            servId: String(item.svcId),
            servNm: item.svcNm,
            jurMnofNm: item.pdeptNm || item.porgNm || '보조금24',
            servDgst: item.svcContent || '',
            servDtlLink: '',
            svcfrstRegTs: item.regDt?.replace(/-/g, '') || '',
            apiSource: 'SUBSIDY',
            priority: 4,
            isNews: false
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
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: {
                    type: 'YOUTH_LIST',
                    pageNo,
                    numOfRows
                }
            });
            data = response.data;
        } else {
            const response = await axios.get(YOUTH_API_URL, {
                params: {
                    openApiVlak: YOUTH_API_KEY,
                    pageIndex: pageNo,
                    display: numOfRows,
                    query: '수당'
                }
            });
            data = response.data;
        }
        const jsonObj = parser.parse(data);
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
            apiSource: 'YOUTH',
            priority: 4,
            isNews: false
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
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: {
                    type: 'MOGEF_LIST',
                    pageNo,
                    numOfRows
                }
            });
            data = response.data;
        } else {
            const response = await axios.get(`${MOGEF_API_URL}/nwEnwSelectList`, {
                params: {
                    serviceKey: decodeURIComponent(API_KEY),
                    pageNo,
                    numOfRows,
                    type: 'xml'
                }
            });
            data = response.data;
        }
        const jsonObj = parser.parse(data);
        const list = jsonObj.response?.body?.items?.item;

        if (!list) return [];
        let arrayList = Array.isArray(list) ? list : [list];

        const mappedList: WelfareService[] = arrayList.map(item => ({
            servId: item.articleId ? `MOGEF_${item.articleId}` : (item.bbtSn ? `MOGEF_${item.bbtSn}` : `MOGEF_${Math.random().toString(36).substring(7)}`),
            servNm: item.title || item.articleTitle,
            jurMnofNm: item.deptNm || '여성가족부',
            servDgst: '',
            servDtlLink: item.viewUrl || '',
            svcfrstRegTs: item.regDt ? String(item.regDt).replace(/-/g, '').substring(0, 8) : '',
            apiSource: 'MOGEF',
            priority: 2,
            isNews: true
        }));

        return mappedList;
    } catch (error) {
        console.error('API Fetch Error (MOGEF):', error);
        return [];
    }
};


/**
 * [신규] 문화체육관광부 정책브리핑 보도자료 조회
 */
export const getMcstPressReleaseList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: { type: 'MCST_PRESS_LIST', pageNo, numOfRows }
            });
            data = response.data;
        } else {
            const response = await axios.get(`${MCST_API_URL}/pressReleaseList`, {
                params: { serviceKey: decodeURIComponent(GENERAL_API_KEY), pageNo, numOfRows }
            });
            data = response.data;
        }
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const body = jsonObj.response?.body || jsonObj.Body || jsonObj;
        const items = body.items || body.NewsItems || body;
        const list = items.item || items.NewsItem || items.row || [];
        if (!list || (Array.isArray(list) && list.length === 0)) return [];
        const arrayList = Array.isArray(list) ? list : [list];

        return arrayList.map(item => ({
            servId: `MCST_PR_${item.articleId}`,
            servNm: item.title,
            jurMnofNm: item.deptNm || '문화체육관광부',
            servDgst: item.subTitle || '',
            servDtlLink: item.articleUrl || '',
            svcfrstRegTs: item.approveDate ? item.approveDate.replace(/-/g, '').substring(0, 8) : '',
            apiSource: 'MCST_PRESS',
            isNews: true,
            priority: 1, // 보도자료는 최상위 우선순위
            deptNm: item.deptNm
        }));
    } catch (error) {
        console.error('API Fetch Error (MCST Press):', error);
        return [];
    }
};


/**
 * [신규] 문화체육관광부 정책뉴스 조회
 */
export const getMcstNewsList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: { type: 'MCST_NEWS_LIST', pageNo, numOfRows }
            });
            data = response.data;
        } else {
            const response = await axios.get('http://apis.data.go.kr/1371000/policyNewsService/policyNewsList', {
                params: { serviceKey: decodeURIComponent(GENERAL_API_KEY), pageNo, numOfRows }
            });
            data = response.data;
        }
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const body = jsonObj.response?.body || jsonObj.Body || jsonObj;
        const items = body.items || body.NewsItems || body;
        const list = items.item || items.NewsItem || items.row || [];
        if (!list || (Array.isArray(list) && list.length === 0)) return [];
        const arrayList = Array.isArray(list) ? list : [list];

        return arrayList.map((item: any) => ({
            servId: `MCST_NW_${item.articleId}`,
            servNm: item.title,
            jurMnofNm: '정책브리핑',
            servDgst: item.subTitle || '',
            servDtlLink: item.articleUrl || '',
            svcfrstRegTs: item.approveDate ? item.approveDate.replace(/-/g, '').substring(0, 8) : '',
            apiSource: 'MCST_NEWS',
            isNews: true,
            priority: 1,
            thumbnail: item.thumbnailUrl
        }));
    } catch (error) {
        console.error('API Fetch Error (MCST News):', error);
        return [];
    }
};


/**
 * [신규] 문화체육관광부 정책포토 조회
 */
export const getMcstPhotoList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: { type: 'MCST_PHOTO_LIST', pageNo, numOfRows }
            });
            data = response.data;
        } else {
            const response = await axios.get('http://apis.data.go.kr/1371000/photoService/photoList', {
                params: { serviceKey: decodeURIComponent(GENERAL_API_KEY), pageNo, numOfRows }
            });
            data = response.data;
        }
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const body = jsonObj.response?.body || jsonObj.Body || jsonObj;
        const items = body.items || body.NewsItems || body;
        const list = items.item || items.NewsItem || items.row || [];
        if (!list || (Array.isArray(list) && list.length === 0)) return [];
        const arrayList = Array.isArray(list) ? list : [list];

        return arrayList.map((item: any) => ({
            servId: `MCST_PH_${item.articleId}`,
            servNm: item.title,
            jurMnofNm: '정책포토',
            servDgst: '',
            servDtlLink: item.articleUrl || '',
            svcfrstRegTs: item.approveDate ? item.approveDate.replace(/-/g, '').substring(0, 8) : '',
            apiSource: 'MCST_PHOTO',
            isNews: true,
            priority: 2,
            thumbnail: item.thumbnailUrl
        }));
    } catch (error) {
        console.error('API Fetch Error (MCST Photo):', error);
        return [];
    }
};


/**
 * [신규] 행정안전부 보조금24 통계 정보 조회
 */
export const getMoisStatsList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: { type: 'MOIS_STATS_LIST', pageNo, numOfRows }
            });
            data = response.data;
        } else {
            // Server side or direct call (fallback)
            const response = await axios.get(`https://apis.data.go.kr/1741000/Subsidy24/getSubsidy24`, {
                params: { serviceKey: decodeURIComponent(GENERAL_API_KEY), pageNo, numOfRows, type: 'json' }
            });
            data = response.data;
        }

        // The proxy returns XML/JSON, ensure parsing
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        
        const body = jsonObj.response?.body || jsonObj.Subsidy24?.body || jsonObj.Subsidy24 || jsonObj;
        const items = body.items || body;
        const list = items.item || items.row || [];
        
        if (!list || (Array.isArray(list) && list.length === 0)) return [];
        const arrayList = Array.isArray(list) ? list : [list];

        return arrayList.map((item: any) => ({
            servId: `MOIS_ST_${item.statsCode || Math.random().toString(36).substring(7)}`,
            servNm: `[통계] ${item.statsNm || '보조금24 이용 통계'}`,
            jurMnofNm: '행정안전부',
            servDgst: `${item.statsValue || ''} (기준: ${item.statsYear || ''}년 ${item.statsMonth || ''}월)`,
            servDtlLink: 'https://www.gov.kr/portal/rcvfvrSvc/main',
            svcfrstRegTs: item.statsYear && item.statsMonth ? `${item.statsYear}${item.statsMonth.padStart(2, '0')}01` : '',
            apiSource: 'MOIS_STATS',
            isNews: true,
            priority: 3,
            keywords: ['보조금24', '통계', '행안부']
        }));
    } catch (error) {
        console.error('API Fetch Error (MOIS Stats):', error);
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
