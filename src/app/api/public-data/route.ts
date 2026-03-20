import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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
            const response = await axios.get('https://www.youthcenter.go.kr/opi/youthPcyList.do', {
                params: {
                    openApiVlak: process.env.NEXT_PUBLIC_YOUTH_API_KEY || '35661a33777592868175d717',
                    pageIndex: pageNo,
                    display: numOfRows,
                    query: '수당'
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        // MCST APIs - Use RAW_API_KEY in URL to avoid double-encoding issues common with data.go.kr
        // MCST APIs - 신규 일반형 키(GEN_API_KEY) 사용
        if (type === 'MCST_PRESS_LIST') {
            const today = new Date();
            const startDay = new Date(today);
            startDay.setDate(today.getDate() - 3);
            const startDate = startDay.toISOString().split('T')[0].replace(/-/g, '');
            const endDate = today.toISOString().split('T')[0].replace(/-/g, '');
            
            const url = `http://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList?serviceKey=${GEN_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&startDate=${startDate}&endDate=${endDate}`;
            const response = await axios.get(url);
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
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
