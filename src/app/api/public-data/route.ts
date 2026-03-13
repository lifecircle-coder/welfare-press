import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const pageNo = searchParams.get('pageNo') || '1';
    const numOfRows = searchParams.get('numOfRows') || '10';
    const searchKeyword = searchParams.get('searchWrd') || '';
    const servId = searchParams.get('servId');

    const API_KEY = process.env.NEXT_PUBLIC_DATA_API_KEY || '';
    const decodedKey = decodeURIComponent(API_KEY);

    try {
        if (type === 'NATIONAL_LIST') {
            const response = await axios.get('http://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001', {
                params: {
                    serviceKey: decodedKey,
                    callTp: 'L',
                    pageNo: 1,
                    numOfRows: 500, // 전체 복지서비스(약 360여건)를 한 번에 가져와서 정렬
                    srchKeyCode: '003',
                    searchWrd: '', // 키워드 제한 없이 전체 호출
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'NATIONAL_DETAIL') {
            const response = await axios.get('http://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfaredetailedV001', {
                params: {
                    serviceKey: decodedKey,
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
                    serviceKey: decodedKey,
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
                    serviceKey: decodedKey,
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
                    serviceKey: decodedKey,
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
                    serviceKey: decodedKey,
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
        if (type === 'MCST_PRESS_LIST') {
            const response = await axios.get('http://apis.data.go.kr/1312000/PolicyBriefingService/getPressReleaseList', {
                params: {
                    serviceKey: decodedKey,
                    pageNo,
                    numOfRows,
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'MCST_NEWS_LIST') {
            const response = await axios.get('http://apis.data.go.kr/1312000/PolicyBriefingService/getNewsList', {
                params: {
                    serviceKey: decodedKey,
                    pageNo,
                    numOfRows,
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'MCST_PHOTO_LIST') {
            const response = await axios.get('http://apis.data.go.kr/1312000/PolicyBriefingService/getPhotoList', {
                params: {
                    serviceKey: decodedKey,
                    pageNo,
                    numOfRows,
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        if (type === 'MOIS_STATS_LIST') {
            const response = await axios.get('http://apis.data.go.kr/1741000/Subsidy24/getStatsInfo', {
                params: {
                    serviceKey: decodedKey,
                    pageNo,
                    numOfRows,
                    year: '2024' // 최신 통계 우선
                }
            });
            return new NextResponse(response.data, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (err: any) {
        console.error('Proxy Error:', err.message);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
