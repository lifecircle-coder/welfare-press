import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const CORPORATE_API_KEY = 'eefcb5c67be6e9da1aecba37f8806ad339c56a74af600774d380920685d87ec3'; // Group A
const GENERAL_API_KEY = '12b8bc4d97607f8df3a88d39efa639e76ea1668505c5762165139c7eff120944'; // Group B

// 1. 한국사회보장정보원_중앙부처복지서비스
const NATIONAL_API_URL = 'http://apis.data.go.kr/B554287/NationalWelfareInformationsV001';

// 2. 한국사회보장정보원_자원정보서비스 (시설, 노인일자리 등)
const RESOURCE_API_URL = 'https://apis.data.go.kr/B554287/resrceInfoInqireService';

// 3. 행정안전부_보조금24 (오픈API 포털 버전)
const SUBSIDY_API_URL = 'https://api.odcloud.kr/api/gov24/v3';

// 4. 온라인청년센터_청년정책_API
const YOUTH_API_URL = 'https://www.youthcenter.go.kr/go/ythip/getPlcy';
const YOUTH_API_KEY = process.env.NEXT_PUBLIC_YOUTH_API_KEY || 'ed4fce74-0c22-423e-98d8-3d7c7443b0d7'; // 인증키 업데이트

// 5. 여성가족부_정책뉴스 (복구)
const MOGEF_API_URL = 'http://apis.data.go.kr/1383000/mogefNew';

// 4. 한국사회보장정보원_지자체복지서비스
const LOCAL_API_URL = 'http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations';

// 6. 문화체육관광부_정책브리핑
const MCST_API_URL = 'http://apis.data.go.kr/1371000/pressReleaseService';

// 7. 행정안전부_보조금24_통계
const MOIS_STATS_API_URL = 'http://apis.data.go.kr/1741000/Subsidy24';

const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: '_text',
});

// HTML Entity Decoder
const decodeHtml = (html: string) => {
    if (!html) return '';
    return html
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&middot;/g, '·')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/<[^>]*>?/gm, ''); // Remove HTML tags
};

// Robust Date Parser
const parseApiDate = (dateStr: string) => {
    if (!dateStr) return '';
    const clean = dateStr.trim();
    
    if (clean.includes('/')) {
        const parts = clean.split(' ')[0].split('/');
        if (parts.length === 3) {
            let y, m, d;
            if (parts[2].length === 4) { // MM/DD/YYYY
                y = parts[2];
                m = parts[0].padStart(2, '0');
                d = parts[1].padStart(2, '0');
            } else if (parts[0].length === 4) { // YYYY/MM/DD
                y = parts[0];
                m = parts[1].padStart(2, '0');
                d = parts[2].padStart(2, '0');
            } else {
                return clean.replace(/[^0-9]/g, '').substring(0, 8);
            }
            return `${y}${m}${d}`;
        }
    }
    return clean.replace(/[^0-9]/g, '').substring(0, 8);
};

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export interface WelfareService {
    servId: string;
    servNm: string;
    jurMnofNm: string;
    servDgst: string;
    servDtlLink: string;
    trgterIndvdlArray?: string;
    slctCritCn?: string;
    alwServCn?: string;
    svcfrstRegTs?: string;
    apiSource?: 'NATIONAL' | 'LOCAL' | 'SUBSIDY' | 'YOUTH' | 'MOGEF' | 'MCST_PRESS' | 'MCST_NEWS' | 'MCST_PHOTO' | 'MOIS_STATS';
    isNews?: boolean;
    priority?: number;
    thumbnail?: string;
    deptNm?: string;
    keywords?: string[];
    fullContent?: string;
}

export interface ResourceService {
    fcltNm: string;
    svcNm: string;
    sidoNm: string;
    sggNm: string;
    rprsNm?: string;
    telNo?: string;
}

export const getNationalWelfareList = async (pageNo = 1, numOfRows = 10, searchKeyword = ''): Promise<WelfareService[]> => {
    if (USE_MOCK_DATA) return getMockNationalData();
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: { type: 'NATIONAL_LIST', searchWrd: searchKeyword }
            });
            data = response.data;
        } else {
            const response = await axios.get(`${NATIONAL_API_URL}/NationalWelfarelistV001`, {
                params: {
                    serviceKey: decodeURIComponent(CORPORATE_API_KEY),
                    callTp: 'L',
                    pageNo: 1,
                    numOfRows: 500,
                    srchKeyCode: '003',
                    searchWrd: '',
                }
            });
            data = response.data;
        }
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const servList = jsonObj.wantedList?.servList || jsonObj.response?.body?.items?.item || jsonObj.servList || jsonObj.data;
        if (!servList) return [];
        let arrayList = Array.isArray(servList) ? servList : [servList];
        let mappedList = arrayList.map((item: any) => ({
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
        mappedList.sort((a, b) => String(b.svcfrstRegTs || '').localeCompare(String(a.svcfrstRegTs || '')));
        return mappedList.slice(0, 50);
    } catch (error) {
        console.error('API Fetch Error (National Welfare List):', error);
        return [];
    }
};

export const getNationalWelfareDetail = async (servId: string): Promise<WelfareService | null> => {
    if (USE_MOCK_DATA) return null;
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', { params: { type: 'NATIONAL_DETAIL', servId } });
            data = response.data;
        } else {
            const response = await axios.get(`${NATIONAL_API_URL}/NationalWelfaredetailedV001`, {
                params: { serviceKey: decodeURIComponent(CORPORATE_API_KEY), callTp: 'D', servId }
            });
            data = response.data;
        }
        const jsonObj = parser.parse(data);
        return jsonObj.wantedDtl ? (jsonObj.wantedDtl as WelfareService) : null;
    } catch (error) {
        console.error(`API Fetch Error (Detail, ID: ${servId}):`, error);
        return null;
    }
}

export const getLocalGovWelfareList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    if (USE_MOCK_DATA) return [];
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', { params: { type: 'LOCAL_LIST', pageNo, numOfRows } });
            data = response.data;
        } else {
            const response = await axios.get(`${LOCAL_API_URL}/LcgvWelfarelist`, {
                params: { serviceKey: decodeURIComponent(CORPORATE_API_KEY), callTp: 'L', pageNo, numOfRows }
            });
            data = response.data;
        }
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const servList = jsonObj.wantedList?.servList || jsonObj.servList || jsonObj.data;
        if (!servList) return [];
        let arrayList = Array.isArray(servList) ? servList : [servList];
        return arrayList.map(item => ({
            servId: item.servId,
            servNm: item.servNm,
            jurMnofNm: `${item.ctpvNm || ''} ${item.sggNm || ''}`.trim() || item.bizChrDeptNm || '지자체',
            servDgst: item.servDgst,
            servDtlLink: '',
            svcfrstRegTs: item.lastModYmd || '',
            apiSource: 'LOCAL',
            priority: 3,
            isNews: false
        }));
    } catch (error) {
        console.error('API Fetch Error (Local Gov List):', error);
        return [];
    }
};

export const getLocalGovWelfareDetail = async (servId: string): Promise<WelfareService | null> => {
    if (USE_MOCK_DATA) return null;
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', { params: { type: 'LOCAL_DETAIL', servId } });
            data = response.data;
        } else {
            const response = await axios.get(`${LOCAL_API_URL}/LcgvWelfaredetailed`, {
                params: { serviceKey: decodeURIComponent(CORPORATE_API_KEY), callTp: 'D', servId }
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

export const getResourceInfoList = async (pageNo = 1, numOfRows = 10): Promise<ResourceService[]> => {
    if (USE_MOCK_DATA) return getMockResourceData();
    try {
        const response = await axios.get(`${RESOURCE_API_URL}/getPrvateResrcInfoInqire`, {
            params: { ServiceKey: decodeURIComponent(CORPORATE_API_KEY), pageNo, numOfRows }
        });
        const jsonObj = parser.parse(response.data);
        const list = jsonObj.response?.body?.items?.item;
        return list ? (Array.isArray(list) ? list : [list]) : [];
    } catch (error) {
        console.error('API Fetch Error (Resource Info List):', error);
        return [];
    }
}

export const getSubsidy24List = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let list;
        if (typeof window !== 'undefined') {
            try {
                const response = await axios.get('/api/public-data', {
                    params: { type: 'SUBSIDY_LIST', pageNo, numOfRows }
                });
                list = response.data?.data || response.data?.item || response.data;
            } catch (proxyError) {
                const directRes = await axios.get(`https://api.odcloud.kr/api/gov24/v1/list`, {
                    params: { serviceKey: decodeURIComponent(CORPORATE_API_KEY), page: pageNo, perPage: numOfRows, returnType: 'json' }
                });
                list = directRes.data?.data || directRes.data?.item || directRes.data;
            }
        } else {
            const response = await axios.get(`https://api.odcloud.kr/api/gov24/v1/list`, {
                params: { serviceKey: decodeURIComponent(CORPORATE_API_KEY), page: pageNo, perPage: numOfRows, returnType: 'json' }
            });
            list = response.data?.data || response.data?.item || response.data;
        }
        if (!list) return [];
        const arrayList = Array.isArray(list) ? list : (list.item || list.data ? (Array.isArray(list.item || list.data) ? (list.item || list.data) : [list.item || list.data]) : [list]);
        
        return arrayList.map((item: any) => {
            const sTitle = item.svcNm || item.svc_nm || item.title || item.svcName || '제목 없음';
            const sId = item.svcId || item.svc_id || item.id || String(Math.random());
            const sContent = item.svcContent || item.svc_content || item.description || item.dgst || '';
            const sUrl = item.dtlResUrl || item.resUrl || item.url || '';
            const sDept = item.pdeptNm || item.porgNm || item.dept || '보조금24';
            const sDate = String(item.regDt || item.lastModTs || item.date || '').replace(/[^0-9]/g, '');

            let category = '일반';
            const searchPool = (sTitle + sContent).toLowerCase();
            if (searchPool.includes('아기') || searchPool.includes('출산') || searchPool.includes('영유아')) category = '영유아';
            else if (searchPool.includes('청년') || searchPool.includes('취업')) category = '청년';
            else if (searchPool.includes('어르신') || searchPool.includes('노인')) category = '어르신';

            return {
                servId: String(sId),
                servNm: sTitle,
                jurMnofNm: sDept,
                servDgst: sContent || '상세 내용을 확인하려면 상세보기 버튼을 클릭하세요.',
                servDtlLink: sUrl,
                svcfrstRegTs: sDate,
                apiSource: 'SUBSIDY',
                priority: 4,
                isNews: false,
                keywords: [category, '보조금24']
            };
        });
    } catch (error) {
        console.error('API Fetch Error (Subsidy24):', error);
        return [];
    }
};

/**
 * [신규] 청년정책 목록 조회 (온라인청년센터)
 * API 파라미터 제약(다중 선택 미지원)을 해결하기 위해 500건을 먼저 가져온 후 후처리를 수행합니다.
 */
export const getYouthPolicyList = async (
    pageNo = 1, 
    numOfRows = 500,
    lclsfNm?: string, 
    zipCd?: string,
    query?: string
): Promise<WelfareService[]> => {
    try {
        let data;
        const isMultiSelect = (lclsfNm && lclsfNm.includes(',')) || (zipCd && zipCd.includes(','));

        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', {
                params: {
                    type: 'YOUTH_LIST',
                    pageNo: isMultiSelect ? 1 : pageNo,
                    numOfRows: isMultiSelect ? 500 : numOfRows,
                    lclsfNm: isMultiSelect ? '' : lclsfNm,
                    zipCd: isMultiSelect ? '' : zipCd,
                    query: query || ''
                }
            });
            data = response.data;
        } else {
            const response = await axios.get(YOUTH_API_URL, {
                params: {
                    apiKeyNm: YOUTH_API_KEY,
                    pageNum: isMultiSelect ? 1 : pageNo,
                    pageSize: isMultiSelect ? 500 : numOfRows,
                    rtnType: 'json',
                    lclsfNm: isMultiSelect ? '' : (lclsfNm || ''),
                    zipCd: isMultiSelect ? '' : (zipCd || ''),
                    plcyNm: query || ''
                }
            });
            data = response.data;
        }

        const resultData = typeof data === 'string' ? JSON.parse(data) : data;
        const list = resultData.result?.youthPolicyList;
        if (!list) return [];
        let arrayList = Array.isArray(list) ? list : [list];

        if (zipCd && zipCd !== '전체') {
            const regionKeywordMap: Record<string, string[]> = {
                '11000': ['서울'], '41000': ['경기'], '28000': ['인천'], '26000': ['부산'],
                '27000': ['대구'], '29000': ['광주'], '30000': ['대전'], '31000': ['울산'],
                '36000': ['세종'], '42000': ['강원'], '43000': ['충북'], '44000': ['충남'],
                '45000': ['전북'], '46000': ['전남'], '47000': ['경북'], '48000': ['경남'],
                '50000': ['제주'], '003002000': ['중앙', '국가', '대한민국']
            };
            const selectedCodes = zipCd.split(',');
            const targetKeywords = selectedCodes.flatMap(code => regionKeywordMap[code] || []);
            if (targetKeywords.length > 0) {
                arrayList = arrayList.filter((item: any) => {
                    const reginNm = (item.polyReginNm || '').toLowerCase();
                    const highInstNm = (item.rgtrHghrkInstCdNm || '').toLowerCase();
                    const upInstNm = (item.rgtrUpInstCdNm || '').toLowerCase();
                    const instNm = (item.rgtrInstCdNm || '').toLowerCase();
                    return targetKeywords.some(kw => {
                        const lowKw = kw.toLowerCase();
                        return reginNm.includes(lowKw) || highInstNm.includes(lowKw) || upInstNm.includes(lowKw) || instNm.includes(lowKw);
                    });
                });
            }
        }

        if (lclsfNm && lclsfNm !== '전체') {
            const selectedCats = lclsfNm.split(',');
            arrayList = arrayList.filter((item: any) => {
                const itemCat = (item.lclsfNm || item.polyBizTyNm || '').toLowerCase();
                return selectedCats.some(cat => {
                    const lowCat = cat.toLowerCase().replace('·', '');
                    const cleanItemCat = itemCat.replace('·', '');
                    return cleanItemCat.includes(lowCat);
                });
            });
        }

        return arrayList.map((item: any) => ({
            servId: item.plcyNo,
            servNm: item.plcyNm,
            jurMnofNm: item.mngtMvmtNm || item.polyReginNm || item.rgtrInstCdNm || '청년정책',
            servDgst: item.plcyExplnCn || '',
            servDtlLink: item.refUrlAddr1 || '',
            svcfrstRegTs: item.lastMdfcnDt ? item.lastMdfcnDt.replace(/[^0-9]/g, '').substring(0, 8) : '',
            apiSource: 'YOUTH',
            priority: 4,
            isNews: false,
            keywords: item.plcyKywdNm ? item.plcyKywdNm.split(',').map((k: string) => k.trim()) : (item.lclsfNm ? [item.lclsfNm] : (item.polyBizTyNm ? [item.polyBizTyNm] : ['청년']))
        }));
    } catch (error) {
        console.error('API Fetch Error (Youth Policy):', error);
        return [];
    }
};

export const getMogefNewsList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', { params: { type: 'MOGEF_LIST', pageNo, numOfRows } });
            data = response.data;
        } else {
            const response = await axios.get(MOGEF_API_URL + '/nwEnwSelectList', {
                params: { serviceKey: decodeURIComponent(CORPORATE_API_KEY), pageNo, numOfRows },
                timeout: 10000
            });
            data = response.data;
        }
        
        const listData = (typeof data === 'string' && data.includes('<?xml')) ? parser.parse(data).response?.body?.items?.item : (data.response?.body?.items?.item || data.items?.item || data.row || []);
        if (!listData || (Array.isArray(listData) && listData.length === 0)) return [];
        const arrayList = Array.isArray(listData) ? listData : [listData];

        return arrayList.map((item: any) => ({
            servId: item.articleId ? `MOGEF_${item.articleId}` : (item.bbtSn ? `MOGEF_${item.bbtSn}` : `MOGEF_${Math.random().toString(36).substring(7)}`),
            servNm: decodeHtml(item.title || item.articleTitle || item.pstTtl || ''),
            jurMnofNm: item.deptNm || '여성가족부',
            servDgst: decodeHtml(item.cont || item.articleContent || item.pstCn || item.title || ''),
            servDtlLink: item.viewUrl || '',
            svcfrstRegTs: parseApiDate(item.regDt || item.ntcDt || ''),
            apiSource: 'MOGEF',
            priority: 2,
            isNews: true,
            thumbnail: item.thumbUrl || item.thumbnailUrl || null,
            fullContent: decodeHtml(item.cont || item.articleContent || item.pstCn || '')
        }));
    } catch (error) {
        console.error('API Fetch Error (MOGEF):', error);
        return [];
    }
};

export const getMcstPressReleaseList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', { params: { type: 'MCST_PRESS_LIST', pageNo, numOfRows } });
            data = response.data;
        } else {
            const response = await axios.get(`${MCST_API_URL}/pressReleaseList`, {
                params: { serviceKey: decodeURIComponent(GENERAL_API_KEY), pageNo, numOfRows }
            });
            data = response.data;
        }
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const items = (jsonObj.response?.body || jsonObj.Body || jsonObj).items || (jsonObj.response?.body || jsonObj.Body || jsonObj);
        const list = items.item || items.NewsItem || items.row || [];
        if (!list || (Array.isArray(list) && list.length === 0)) return [];
        const arrayList = Array.isArray(list) ? list : [list];

        return arrayList.map((item: any) => ({
            servId: `MCST_PR_${item.NewsItemId || item.articleId || item.articleID || Math.random().toString(36).substring(7)}`,
            servNm: decodeHtml(item.Title || item.title || '제목 없음'),
            jurMnofNm: item.DeptNm || item.deptNm || '문화체육관광부',
            servDgst: decodeHtml([item.SubTitle1, item.SubTitle2, item.SubTitle3].filter(Boolean).join(' | ') || item.SubTitle || item.subTitle || ''),
            servDtlLink: item.ArticleUrl || item.articleUrl || item.OriginalUrl || '',
            svcfrstRegTs: parseApiDate(item.ApproveDate || item.approveDate || ''),
            apiSource: 'MCST_PRESS',
            isNews: true,
            priority: 1,
            deptNm: item.DeptNm || item.deptNm,
            fullContent: decodeHtml(item.DataContents || '')
        }));
    } catch (error) {
        console.error('API Fetch Error (MCST Press):', error);
        return [];
    }
};

export const getMcstNewsList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', { params: { type: 'MCST_NEWS_LIST', pageNo, numOfRows } });
            data = response.data;
        } else {
            const response = await axios.get('http://apis.data.go.kr/1371000/policyNewsService/policyNewsList', {
                params: { serviceKey: decodeURIComponent(GENERAL_API_KEY), pageNo, numOfRows }
            });
            data = response.data;
        }
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const items = (jsonObj.response?.body || jsonObj.Body || jsonObj).items || (jsonObj.response?.body || jsonObj.Body || jsonObj);
        const list = items.item || items.NewsItem || items.row || [];
        if (!list || (Array.isArray(list) && list.length === 0)) return [];
        const arrayList = Array.isArray(list) ? list : [list];

        return arrayList.map((item: any) => ({
            servId: `MCST_NW_${item.NewsItemId || item.articleId || item.articleID || Math.random().toString(36).substring(7)}`,
            servNm: decodeHtml(item.Title || item.title || '제목 없음'),
            jurMnofNm: '정책브리핑',
            servDgst: decodeHtml([item.SubTitle1, item.SubTitle2, item.SubTitle3].filter(Boolean).join(' | ') || item.SubTitle || item.subTitle || ''),
            servDtlLink: item.ArticleUrl || item.articleUrl || item.OriginalUrl || '',
            svcfrstRegTs: parseApiDate(item.ApproveDate || item.approveDate || ''),
            apiSource: 'MCST_NEWS',
            isNews: true,
            priority: 1,
            thumbnail: item.ThumbnailUrl || item.thumbnailUrl,
            fullContent: decodeHtml(item.DataContents || '')
        }));
    } catch (error) {
        console.error('API Fetch Error (MCST News):', error);
        return [];
    }
};

export const getMcstPhotoList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', { params: { type: 'MCST_PHOTO_LIST', pageNo, numOfRows } });
            data = response.data;
        } else {
            const response = await axios.get('http://apis.data.go.kr/1371000/photoService/photoList', {
                params: { serviceKey: decodeURIComponent(GENERAL_API_KEY), pageNo, numOfRows }
            });
            data = response.data;
        }
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const items = jsonObj.response?.body?.items || jsonObj.Body?.Items || jsonObj.items || jsonObj;
        const list = items.item || items.NewsItem || items.row || (Array.isArray(items) ? items : []);
        if (!list || (Array.isArray(list) && list.length === 0)) return [];
        const arrayList = Array.isArray(list) ? list : [list];

        return arrayList.map((item: any) => ({
            servId: `MCST_PH_${item.NewsItemId || item.articleId || item.articleID || Math.random().toString(36).substring(7)}`,
            servNm: decodeHtml(item.Title || item.title || '제목 없음'),
            jurMnofNm: '정책포토',
            servDgst: decodeHtml([item.SubTitle1, item.SubTitle2, item.SubTitle3].filter(Boolean).join(' | ') || item.SubTitle || item.subTitle || item.title || ''),
            servDtlLink: item.ArticleUrl || item.articleUrl || item.OriginalUrl || item.viewUrl || '',
            svcfrstRegTs: parseApiDate(item.ApproveDate || item.approveDate || ''),
            apiSource: 'MCST_PHOTO',
            isNews: true,
            priority: 2,
            thumbnail: item.ThumbnailUrl || item.thumbnailUrl || item.thumbUrl || null,
            fullContent: decodeHtml(item.DataContents || '')
        }));
    } catch (error) {
        console.error('API Fetch Error (MCST Photo):', error);
        return [];
    }
};

export const getMoisStatsList = async (pageNo = 1, numOfRows = 50): Promise<WelfareService[]> => {
    try {
        let data;
        if (typeof window !== 'undefined') {
            const response = await axios.get('/api/public-data', { params: { type: 'MOIS_STATS_LIST', pageNo, numOfRows } });
            data = response.data;
        } else {
            const response = await axios.get(`https://apis.data.go.kr/1741000/Subsidy24/getSubsidy24`, {
                params: { serviceKey: decodeURIComponent(GENERAL_API_KEY), pageNo, numOfRows, type: 'json' }
            });
            data = response.data;
        }
        const jsonObj = typeof data === 'object' && !(data instanceof Document) ? data : parser.parse(String(data));
        const list = jsonObj.items || jsonObj.item || jsonObj.row || [];
        const arrayList = Array.isArray(list) ? list : (list ? [list] : []);
        if (arrayList.length === 0) return [];
        return arrayList.map((item: any) => ({
            servId: `MOIS_ST_${item.StatsCode || item.statsCode || Math.random().toString(36).substring(7)}`,
            servNm: `[통계] ${item.StatsNm || item.statsNm || '보조금24 이용 통계'}`,
            jurMnofNm: '행정안전부',
            servDgst: `${item.StatsValue || item.statsValue || ''} (기준: ${item.StatsYear || ''}년 ${item.StatsMonth || ''}월)`,
            servDtlLink: 'https://www.gov.kr/portal/rcvfvrSvc/main',
            svcfrstRegTs: (item.StatsYear && item.StatsMonth) ? `${item.StatsYear}${String(item.StatsMonth).padStart(2, '0')}01` : '',
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

export const getMockNationalData = (): WelfareService[] => {
    return [
        { servId: 'WLF00001001', servNm: '노인일자리 및 사회활동 지원사업', jurMnofNm: '보건복지부', servDgst: '...', servDtlLink: '#', svcfrstRegTs: '20230101' },
        { servId: 'WLF00001002', servNm: '청년내일저축계좌', jurMnofNm: '보건복지부', servDgst: '...', servDtlLink: '#', svcfrstRegTs: '20230510' }
    ];
};

export const getMockResourceData = (): ResourceService[] => {
    return [
        { fcltNm: '종로시니어클럽', svcNm: '노인일자리 알선', sidoNm: '서울특별시', sggNm: '종로구' },
        { fcltNm: '강남구 치매안심센터', svcNm: '치매예방상담', sidoNm: '서울특별시', sggNm: '강남구' }
    ];
};
