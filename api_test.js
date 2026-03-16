const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: '_text',
});

const API_KEY = '12b8bc4d97607f8df3a88d39efa639e76ea1668505c5762165139c7eff120944'; // GENERAL_API_KEY from the code

async function testMCST() {
    console.log('--- Testing MCST Press Release ---');
    try {
        const response = await axios.get('http://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList', {
            params: { serviceKey: API_KEY, pageNo: 1, numOfRows: 2 }
        });
        const jsonObj = parser.parse(response.data);
        const body = jsonObj.response?.body || jsonObj.Body || jsonObj;
        const items = body.items || body.NewsItems || body;
        const list = items.item || items.NewsItem || items.row || [];
        const arrayList = Array.isArray(list) ? list : [list];
        console.log('Sample Item:', JSON.stringify(arrayList[0], null, 2));
    } catch (e) { console.error('MCST Press Failed:', e.message); }
}

async function testMogef() {
    console.log('\n--- Testing MOGEF News ---');
    try {
        const response = await axios.get('http://apis.data.go.kr/1383000/mogefNew/nwEnwSelectList', {
            params: { serviceKey: API_KEY, pageNo: 1, numOfRows: 1, type: 'xml' }
        });
        const jsonObj = parser.parse(response.data);
        console.log('Mogef Sample:', JSON.stringify(jsonObj.response?.body?.items?.item || jsonObj, null, 2));
    } catch (e) { console.error('Mogef Failed:', e.message); }
}

async function testPhoto() {
    console.log('\n--- Testing MCST Photo ---');
    try {
        const response = await axios.get('http://apis.data.go.kr/1371000/photoService/photoList', {
            params: { serviceKey: API_KEY, pageNo: 1, numOfRows: 1 }
        });
        const jsonObj = parser.parse(response.data);
        console.log('Photo Sample:', JSON.stringify(jsonObj.response?.body?.items?.item || jsonObj, null, 2));
    } catch (e) { console.error('Photo Failed:', e.message); }
}

async function run() {
    await testMCST();
    await testMogef();
    await testPhoto();
}

run();
