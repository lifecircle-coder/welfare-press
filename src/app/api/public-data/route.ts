import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const pageNo = searchParams.get('pageNo') || '1';
    const numOfRows = searchParams.get('numOfRows') || '10';
    const servId = searchParams.get('servId');

    const CORP_API_KEY = process.env.NEXT_PUBLIC_DATA_API_KEY || ''; // 기존 기업형 키
    const GEN_API_KEY = process.env.NEXT_PUBLIC_GENERAL_DATA_API_KEY || ''; // 신규 일반형 키 (env에서 가져오도록 수정)
    
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
                    serviceKey: decodedCorpKey, // 기존 키 유지
                    callTp: 'L',
                    pageNo,
                    numOfRows,
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
        }

        if (type === 'LOCAL_DETAIL') {
            const response = await axios.get('http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfaredetailed', {
                params: {
                    serviceKey: decodedCorpKey, // 기존 키 유지
                    callTp: 'D',
                    servId,
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
        }

        if (type === 'MOGEF_LIST') {
            const response = await axios.get('http://apis.data.go.kr/1383000/mogefNew/nwEnwSelectList', {
                params: {
                    serviceKey: decodedGenKey, // 신규 일반형 키 적용
                    pageNo,
                    numOfRows,
                    type: 'xml'
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'SUBSIDY_LIST') {
            const response = await axios.get('https://api.odcloud.kr/api/gov24/v3/serviceList', {
                params: {
                    serviceKey: decodedGenKey, // 신규 일반형 키 적용
                    page: pageNo,
                    perPage: numOfRows,
                }
            });
            return NextResponse.json(response.data);
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
            startDay.setFullYear(today.getFullYear() - 1);
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
            startDay.setFullYear(today.getFullYear() - 1);
            const startDate = startDay.toISOString().split('T')[0].replace(/-/g, '');
            const endDate = today.toISOString().split('T')[0].replace(/-/g, '');

            const url = `http://apis.data.go.kr/1371000/policyNewsService/policyNewsList?serviceKey=${GEN_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&startDate=${startDate}&endDate=${endDate}`;
            const response = await axios.get(url);
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'MCST_PHOTO_LIST') {
            const today = new Date();
            const startDay = new Date(today);
            startDay.setFullYear(today.getFullYear() - 1);
            const startDate = startDay.toISOString().split('T')[0].replace(/-/g, '');
            const endDate = today.toISOString().split('T')[0].replace(/-/g, '');

            const url = `http://apis.data.go.kr/1371000/photoService/photoList?serviceKey=${GEN_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&startDate=${startDate}&endDate=${endDate}`;
            const response = await axios.get(url);
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'MOIS_STATS_LIST') {
            const url = `https://apis.data.go.kr/1741000/Subsidy24/getSubsidy24?serviceKey=${GEN_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
            const response = await axios.get(url);
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
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
