import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const pageNo = searchParams.get('pageNo') || '1';
    const numOfRows = searchParams.get('numOfRows') || '10';
    const servId = searchParams.get('servId');

    const CORP_API_KEY = process.env.NEXT_PUBLIC_DATA_API_KEY || 'eefcb5c67be6e9da1aecba37f8806ad339c56a74af600774d380920685d87ec3'; // Group A (Corporate)
    const GEN_API_KEY = process.env.NEXT_PUBLIC_GENERAL_DATA_API_KEY || '12b8bc4d97607f8df3a88d39efa639e76ea1668505c5762165139c7eff120944'; // Group B (General)
    
    // Decoding for axios params usage
    const decodedCorpKey = decodeURIComponent(CORP_API_KEY);
    const decodedGenKey = decodeURIComponent(GEN_API_KEY);

    try {
        if (type === 'NATIONAL_LIST') {
            const response = await axios.get('http://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001', {
                params: {
                    serviceKey: decodedCorpKey, // 기존 키 유지
                    callTp: 'L',
                    pageNo: 1,
                    numOfRows: 500,
                    srchKeyCode: '003',
                    searchWrd: '',
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'NATIONAL_DETAIL') {
            const response = await axios.get('http://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfaredetailedV001', {
                params: {
                    serviceKey: decodedCorpKey, // 기존 키 유지
                    callTp: 'D',
                    servId,
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'LOCAL_LIST') {
            const response = await axios.get('http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist', {
                params: {
                    serviceKey: decodedCorpKey,
                    callTp: 'L',
                    pageNo,
                    numOfRows,
                }
            });
            return NextResponse.json(response.data);
        }

        if (type === 'LOCAL_DETAIL') {
            const response = await axios.get('http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfaredetailed', {
                params: {
                    serviceKey: decodedCorpKey,
                    callTp: 'D',
                    servId,
                }
            });
            return NextResponse.json(response.data);
        }


        if (type === 'MOGEF_LIST') {
            // MOGEF (1383000) is often sensitive to key encoding. Try raw key or _type=json
            const url = `http://apis.data.go.kr/1383000/mogefNew/nwEnwSelectList?serviceKey=${CORP_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&_type=json`;
            const response = await axios.get(url, { timeout: 7000 });
            return new NextResponse(JSON.stringify(response.data), {
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
        }

        if (type === 'SUBSIDY_LIST') {
            const baseUrl = 'https://api.odcloud.kr/api/gov24/v1/list';
            let finalData;
            
            try {
                // Try 1: Native Fetch with Literal URL (Prevents Axios encoding bugs)
                // Gov24 v1 stable logic using CORPORATE_API_KEY as per 3/19
                const fullUrl = `${baseUrl}?serviceKey=${CORP_API_KEY}&page=${pageNo}&perPage=${numOfRows}&returnType=json`;
                const res = await fetch(fullUrl);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                finalData = await res.json();
            } catch (e1: any) {
                console.error('Subsidy V1 Corp Key Failed, trying Gen Key...', e1.message);
                try {
                    const fullUrl = `${baseUrl}?serviceKey=${GEN_API_KEY}&page=${pageNo}&perPage=${numOfRows}&returnType=json`;
                    const res = await fetch(fullUrl);
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    finalData = await res.json();
                } catch (e2: any) {
                    console.error('Subsidy V1 Gen Key Failed', e2.message);
                    throw e2;
                }
            }

            if (!finalData) throw new Error('Subsidy24 API returned empty');
            return NextResponse.json(finalData);
        }

        if (type === 'YOUTH_LIST') {
            const plcyNm = searchParams.get('query') || ''; // 정책명 검색어
            const lclsfNm = searchParams.get('lclsfNm') || ''; // 정책분야 (명칭)
            const zipCd = searchParams.get('zipCd') || ''; // 지역코드 (5자리)
            const youthKey = process.env.NEXT_PUBLIC_YOUTH_API_KEY || 'ed4fce74-0c22-423e-98d8-3d7c7443b0d7';
            const response = await axios.get('https://www.youthcenter.go.kr/go/ythip/getPlcy', {
                params: {
                    apiKeyNm: youthKey,
                    pageNum: pageNo,
                    pageSize: numOfRows,
                    rtnType: 'json',
                    plcyNm,
                    lclsfNm,
                    zipCd
                }
            });
            return NextResponse.json(response.data);
        }

        // MCST APIs - Use RAW_API_KEY in URL to avoid double-encoding issues common with data.go.kr
        // MCST APIs - 신규 일반형 키(GEN_API_KEY) 사용
        if (type === 'MCST_PRESS' || type === 'MCST_PRESS_LIST') {
            const query = searchParams.get('query') || '';
            const today = new Date();
            
            const decodedGen = decodeURIComponent(GEN_API_KEY);
            const decodedCorp = decodeURIComponent(CORP_API_KEY);

            // 지역명 분석 (구 -> 시/도 매핑)
            function getRegionMeta(q: string) {
                const regionMap: Record<string, { city: string, sgg: string }> = {
                    '관악구': { city: '서울특별시', sgg: '관악구' },
                    '수원시': { city: '경기도', sgg: '수원시' },
                    '강남구': { city: '서울특별시', sgg: '강남구' },
                    '성남시': { city: '경기도', sgg: '성남시' },
                    '용인시': { city: '경기도', sgg: '용인시' },
                    '송파구': { city: '서울특별시', sgg: '송파구' },
                    '강서구': { city: '서울특별시', sgg: '강서구' },
                    '노원구': { city: '서울특별시', sgg: '노원구' },
                    '부천시': { city: '경기도', sgg: '부천시' },
                    '화성시': { city: '경기도', sgg: '화성시' },
                    '안산시': { city: '경기도', sgg: '안산시' },
                    '안양시': { city: '경기도', sgg: '안양시' },
                    '평택시': { city: '경기도', sgg: '평택시' },
                    '시흥시': { city: '경기도', sgg: '시흥시' },
                };
                
                // 매핑 테이블에 없으면 기본적으로 query를 sgg로, 공백을 city로
                if (regionMap[q]) return regionMap[q];
                
                if (q.includes('서울')) return { city: '서울특별시', sgg: q.replace('서울특별시', '').trim() };
                if (q.includes('경기')) return { city: '경기도', sgg: q.replace('경기도', '').trim() };
                
                return { city: '', sgg: q };
            }

            const meta = getRegionMeta(query);

            let items: any[] = [];
            
            async function fetchLocalizedNews(searchWrd: string, targetCity: string, targetSgg: string) {
                const results: any[] = [];
                
                // 1. 지자체 복지 공고 (Local Welfare API)
                try {
                    const localUrl = `http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist?serviceKey=${decodedCorp}&callTp=L&pageNo=1&numOfRows=10` 
                                   + (targetCity ? `&ctpvNm=${encodeURIComponent(targetCity)}` : '')
                                   + (targetSgg ? `&sggNm=${encodeURIComponent(targetSgg)}` : '');
                    
                    const res = await axios.get(localUrl, { timeout: 4000 });
                    const parser = new XMLParser({ ignoreAttributes: true });
                    const parsedXml = parser.parse(res.data);
                    const list = parsedXml?.ServiceList?.servList;

                    if (list) {
                        const itemsList = Array.isArray(list) ? list : [list];
                        const parsed = itemsList.map((it: any) => ({
                            servId: it.servId?.toString() || `local-${Math.random()}`,
                            servNm: it.servNm,
                            jurMnofNm: it.jurMnofNm || targetCity || '지자체',
                            servDtlLink: `/welfare/detail/${it.servId}?type=LOCAL`,
                            svcfrstRegTs: it.svcfrstRegTs?.toString().replace(/-/g, '') || ''
                        }));
                        results.push(...parsed);
                    }
                } catch (e) {}

                // 2. 온통청년 정책 정보 (Keyword Search)
                if (results.length < 5) {
                    try {
                        const youthKey = process.env.NEXT_PUBLIC_YOUTH_API_KEY || 'ed4fce74-0c22-423e-98d8-3d7c7443b0d7';
                        const keyword = targetSgg ? `${targetSgg} 청년` : (searchWrd || '청년');
                        const youthUrl = `https://www.youthcenter.go.kr/opi/youthPolicyList.do?openApiVlak=${youthKey}&display=10&pageIndex=1&query=${encodeURIComponent(keyword)}`;
                        const res = await axios.get(youthUrl, { timeout: 3500 });
                        const parser = new XMLParser({ ignoreAttributes: true });
                        const result = parser.parse(res.data);
                        
                        let policyItems = result.youthPolicyList?.youthPolicy;
                        if (policyItems) {
                            if (!Array.isArray(policyItems)) policyItems = [policyItems];
                            const parsed = policyItems.map((it: any) => ({
                                servId: it.bizId?.toString() || `policy-${Math.random()}`,
                                servNm: `[정책] ${it.polyBizSjnm}`,
                                jurMnofNm: it.polyBizTy || '정책뉴스',
                                servDtlLink: `/welfare/detail/${it.bizId}`,
                                svcfrstRegTs: ''
                            }));
                            results.push(...parsed);
                        }
                    } catch (e) {}
                }

                return results;
            }

            // 날짜 필터링 유틸리티 (2024, 2025 제외)
            function filterOldNews(newsItems: any[]) {
                return newsItems.filter(it => {
                    if (!it.svcfrstRegTs) return true; // 날짜 없으면 일단 포함
                    const year = it.svcfrstRegTs.substring(0, 4);
                    // 2024년도 2025 소식은 필요없어. 최신 소식만 노출해.
                    return year !== '2024' && year !== '2025';
                });
            }

            try {
                // 1단계: 특정 구(District) 데이터 요청
                items = await fetchLocalizedNews(query, meta.city, meta.sgg);
                items = filterOldNews(items);

                // 2단계: 특정 구 데이터 부족 시 시/도(City) 전체 데이터로 확장
                if (items.length < 3 && meta.city) {
                    const cityItems = await fetchLocalizedNews(query, meta.city, '');
                    const filteredCityItems = filterOldNews(cityItems);
                    const existingIds = new Set(items.map(it => it.servId));
                    filteredCityItems.forEach(it => {
                        if (!existingIds.has(it.servId)) items.push(it);
                    });
                }

                // 3단계: 여전히 부족 시 온통청년 공지사항 추가
                if (items.length < 3) {
                    try {
                        const youthKey = process.env.NEXT_PUBLIC_YOUTH_API_KEY || 'ed4fce74-0c22-423e-98d8-3d7c7443b0d7';
                        const youthUrl = `https://www.youthcenter.go.kr/go/ythip/getAnnList?apiKeyNm=${youthKey}&pageNum=1&pageSize=10&rtnType=json`;
                        const res = await axios.get(youthUrl, { timeout: 3500 });
                        const annList = res.data?.annList?.ann;
                        if (annList && Array.isArray(annList)) {
                            const parsed = annList.map((it: any) => ({
                                servId: it.annId?.toString() || `ann-${Math.random()}`,
                                servNm: it.annTtl,
                                jurMnofNm: '온통청년',
                                servDtlLink: `https://www.youthcenter.go.kr/board/boardDetail.do?boardId=ANN&atclId=${it.annId}`,
                                svcfrstRegTs: it.annRegDt?.toString().replace(/-/g, '') || ''
                            }));
                            const filteredAnn = filterOldNews(parsed);
                            const existingIds = new Set(items.map(it => it.servId));
                            filteredAnn.forEach(it => {
                                if (!existingIds.has(it.servId)) items.push(it);
                            });
                        }
                    } catch (e) {}
                }

                // 최종 안전장치: 지역화된 2026 가이드
                if (items.length === 0) {
                    items = [
                        {
                            servId: 'static-2026-1',
                            servNm: `[${query || '전국'}] 2026년 청년 월세지원 및 주거 정책 총정리`,
                            jurMnofNm: query || '보건복지부',
                            servDtlLink: 'https://www.bokjiro.go.kr',
                            svcfrstRegTs: '20260320'
                        },
                        {
                            servId: 'static-2026-2',
                            servNm: '청년도약계좌 2026년 가입 조건 및 우대 금리 안내',
                            jurMnofNm: '금융위원회',
                            servDtlLink: 'https://ylaccount.kinfa.or.kr',
                            svcfrstRegTs: '20260315'
                        }
                    ];
                }
            } catch (err) {
                console.error('Unified News Fetch Error');
            }
            
            return NextResponse.json(items.slice(0, 7));
        }


        if (type === 'MCST_NEWS_LIST') {
            const today = new Date();
            const startDay = new Date(today);
            startDay.setDate(today.getDate() - 3);
            const startDate = startDay.toISOString().split('T')[0].replace(/-/g, '');
            const endDate = today.toISOString().split('T')[0].replace(/-/g, '');

            const url = `http://apis.data.go.kr/1371000/policyNewsService/policyNewsList?serviceKey=${GEN_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&startDate=${startDate}&endDate=${endDate}`;
            const response = await axios.get(url);
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'MCST_PHOTO_LIST') {
            try {
                // Try Group B (General) first as requested, fallback to Group A (Corp)
                let url = `http://apis.data.go.kr/1371000/photoService/photoList?serviceKey=${GEN_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
                let response = await axios.get(url, { timeout: 7000 });
                if (response.data.includes('Portal API error')) {
                    url = `http://apis.data.go.kr/1371000/photoService/photoList?serviceKey=${CORP_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
                    response = await axios.get(url, { timeout: 7000 });
                }
                return new NextResponse(response.data, {
                    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
                });
            } catch (err) {
                console.error('MCST Photo API Error:', err);
                return NextResponse.json({ error: 'Portal API error', items: [] }, { status: 200 });
            }
        }


        if (type === 'MOIS_STATS_LIST') {
            const url = `http://apis.data.go.kr/1741000/Subsidy24/getSubsidy24?serviceKey=${GEN_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&type=json`;
            const response = await axios.get(url, { timeout: 7000 });
            // Normalize JSON structure for Statistics to prevent frontend parsing bugs.
            const rawData = response.data;
            const items = rawData?.Subsidy24?.[1]?.row || rawData?.Subsidy24?.row || rawData?.row || [];
            return NextResponse.json({ items });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (err: any) {
        if (err.response) {
            console.error('Proxy Error Response:', err.response.status, err.response.data);
        } else {
            console.error('Proxy Error Message:', err.message);
        }
        return NextResponse.json({ 
            error: 'Failed to fetch data', 
            details: err.message,
            status: err.response?.status
        }, { status: 500 });
    }
}
