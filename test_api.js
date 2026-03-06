const axios = require('axios');

async function testApi() {
    const url = 'http://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001';
    const API_KEY = 'eefcb5c67be6e9da1aecba37f8806ad339c56a74af600774d380920685d87ec3';

    try {
        console.log('데이터를 요청하는 중입니다...');

        const response = await axios.get(url, {
            params: {
                serviceKey: API_KEY, // 일반 인증키
                callTp: 'L',         // 호출 타입 (L: 목록)
                pageNo: 1,           // 페이지 번호
                numOfRows: 3,        // 한 페이지 결과 수
                srchKeyCode: '003',  // 검색 조건 (003: 제목+내용)
                searchWrd: '청년'    // 검색어 (검색어가 없으면 0건이 반환될 수 있음)
            }
        });

        console.log('\n==== [API 응답 결과 원본] ====\n');
        // 응답 데이터 전체를 콘솔에 출력합니다.
        console.log(response.data);
        console.log('\n==============================\n');

    } catch (error) {
        console.error('API 요청 중 오류가 발생했습니다:', error.message);
        if (error.response) {
            console.error('오류 상세:', error.response.data);
        }
    }
}

testApi();
