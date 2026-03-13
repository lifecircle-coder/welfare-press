
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const API_KEY = envLocal.match(/NEXT_PUBLIC_DATA_API_KEY=(.*)/)?.[1]?.trim();

const parser = new XMLParser({
    ignoreAttributes: false,
});

async function scanAllItems() {
    const decodedKey = decodeURIComponent(API_KEY);
    try {
        console.log('--- Fetching ALL National API items (400) ---');
        const res = await axios.get('http://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001', {
            params: {
                serviceKey: decodedKey,
                callTp: 'L',
                pageNo: 1,
                numOfRows: 400,
                srchKeyCode: '003',
                searchWrd: '',
            }
        });
        
        const jsonObj = parser.parse(res.data);
        const list = jsonObj.wantedList?.servList;
        
        if (Array.isArray(list)) {
            console.log(`Total items fetched: ${list.length}`);
            
            // Sort by date descending
            const sorted = [...list].sort((a,b) => String(b.svcfrstRegTs || '').localeCompare(String(a.svcfrstRegTs || '')));
            
            console.log('\nTop 20 Latest Items:');
            sorted.slice(0, 20).forEach((item, idx) => {
                console.log(`[${idx+1}] [${item.svcfrstRegTs}] ${item.servNm}`);
            });

            const gapItems = sorted.filter(item => {
                const date = parseInt(item.svcfrstRegTs);
                return date > 20251127 && date < 20260309;
            });
            console.log(`\nItems in gap (20251127-20260309): ${gapItems.length}`);
        } else {
            console.log('Failed to fetch array.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

scanAllItems();
