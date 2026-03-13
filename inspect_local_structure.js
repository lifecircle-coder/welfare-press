
const axios = require('axios');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const API_KEY = envLocal.match(/NEXT_PUBLIC_DATA_API_KEY=(.*)/)?.[1]?.trim();

async function inspectLocalGovStructure() {
    const decodedKey = decodeURIComponent(API_KEY);
    try {
        console.log('--- Fetching Local Gov API (JSON) ---');
        const res = await axios.get('http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist', {
            params: {
                serviceKey: decodedKey,
                callTp: 'L',
                pageNo: 1,
                numOfRows: 5,
                // arrgOrd is removed
            }
        });
        
        console.log('Response Content-Type:', res.headers['content-type']);
        console.log('Response Data Structure (Keys):', Object.keys(res.data));
        
        if (res.data.servList) {
            console.log('First Item Structure:', Object.keys(res.data.servList[0]));
            console.log('First Item Data:', JSON.stringify(res.data.servList[0], null, 2));
        } else {
            console.log('servList not found in response. Full data:', JSON.stringify(res.data, null, 2));
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

inspectLocalGovStructure();
