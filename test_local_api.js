const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const API_KEY = process.env.NEXT_PUBLIC_DATA_API_KEY;
const URL = 'http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist';

async function test() {
    try {
        console.log('Fetching Local Gov API...');
        const res = await axios.get(URL, {
            params: {
                serviceKey: decodeURIComponent(API_KEY),
                callTp: 'L',
                pageNo: 1,
                numOfRows: 10,
                arrgOrd: '001'
            }
        });

        console.log('Status:', res.status);
        console.log('Headers:', res.headers['content-type']);
        console.log('Raw Data typeof:', typeof res.data);
        console.log('Raw Data snippet:', typeof res.data === 'string' ? res.data.substring(0, 1000) : JSON.stringify(res.data).substring(0, 1000));

    } catch (e) {
        console.error('Error fetching API:', e.message);
    }
}

test();
