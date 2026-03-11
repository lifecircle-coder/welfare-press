const fs = require('fs');
const path = require('path');

const imgPath1 = path.join(__dirname, 'public', 'assets', 'symbol4_premium_blue.png');
const imgPath2 = path.join(__dirname, 'public', 'assets', 'symbol4.png');

const base64Image1 = fs.readFileSync(imgPath1, { encoding: 'base64' });
const dataUri1 = 'data:image/png;base64,' + base64Image1;

let dataUri2 = '';
try {
  const base64Image2 = fs.readFileSync(imgPath2, { encoding: 'base64' });
  dataUri2 = 'data:image/png;base64,' + base64Image2;
} catch (e) {
  console.warn('symbol4.png not found, falling back to symbol4_premium_blue.png for demonstration if needed');
  dataUri2 = dataUri1; // fallback
}

// 텍스트 크기: 심볼은 높이 44. 그 90%면 약 39.6. 폰트 크기 36px 정도면 여백 제외하고 시각적으로 비슷.
const mainBlue = '#137FEC';

const options = [
  { name: '1. 프리미엄 블루 심볼 + 네이비 원톤', desc: 'THE (네이비), 복지 (네이비)', img: dataUri1, the: '#0F172A', bokji: '#0F172A' },
  { name: '2. 프리미엄 블루 심볼 + 투톤 (그레이/네이비)', desc: 'THE (그레이), 복지 (네이비)', img: dataUri1, the: '#64748B', bokji: '#0F172A' },
  { name: '3. 프리미엄 블루 심볼 + 차콜 블랙', desc: 'THE (차콜), 복지 (차콜)', img: dataUri1, the: '#27272A', bokji: '#27272A' },
  { name: '4. symbol4 (보라/파랑) + 블루 원톤', desc: 'THE (블루), 복지 (블루)', img: dataUri2, the: mainBlue, bokji: mainBlue },
  { name: '5. symbol4 (보라/파랑) + 투톤 (그레이/블루)', desc: 'THE (그레이), 복지 (블루)', img: dataUri2, the: '#64748B', bokji: mainBlue },
  { name: '6. symbol4 (보라/파랑) + 투톤 (블루/네이비)', desc: 'THE (블루), 복지 (네이비)', img: dataUri2, the: mainBlue, bokji: '#0F172A' },
];

let svgsHtml = options.map((opt, i) => `
  <div class="option-card">
    <h2>Option ${i+1}: ${opt.name}</h2>
    <p>${opt.desc}</p>
    <div class="logo-container">
      <svg width="350" height="60" viewBox="0 0 350 60" xmlns="http://www.w3.org/2000/svg">
        <!-- 3D 심볼 이미지 (Base64 하이브리드) -->
        <image href="${opt.img}" x="0" y="8" width="44" height="44" />
        
        <!-- 영문 THE + 한칸 띄어쓰기 + 국문 복지 -->
        <!-- 크기 36 (심볼 44 대비 약 90% 시각적 스케일) -->
        <text x="54" y="42" font-size="36">
           <!-- THE: Gmarket Sans Bold -->
           <tspan font-family="'GmarketSansBold', sans-serif" font-weight="700" fill="${opt.the}">THE</tspan>
           <!-- 스페이스바 한 칸 + 복지: SUIT Heavy -->
           <tspan font-family="'SUIT-Heavy', sans-serif" font-weight="900" fill="${opt.bokji}" letter-spacing="-1.5"> 복지</tspan>
        </text>
      </svg>
    </div>
  </div>
`).join('');

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>로고 디자인 프리뷰 V2 - THE 복지</title>
<style>
  @font-face {
      font-family: 'GmarketSansBold';
      src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff') format('woff');
      font-weight: 700;
      font-style: normal;
  }
  @font-face {
      font-family: 'SUIT-Heavy';
      src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_suit@1.0/SUIT-Heavy.woff2') format('woff2');
      font-weight: 900;
      font-style: normal;
  }
  body {
    font-family: 'SUIT-Heavy', sans-serif;
    background-color: #f8fafc;
    color: #333;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
  }
  h1 { font-size: 24px; margin-bottom: 20px; color: #1e293b; text-align: center; }
  .grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    width: 100%;
    max-width: 1200px;
  }
  .option-card {
    background: #fff;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    text-align: center;
  }
  .option-card h2 { margin: 0 0 10px 0; font-size: 18px; color: #0f172a; }
  .option-card p { margin: 0 0 20px 0; font-size: 14px; color: #64748b; font-weight: 400; }
  .logo-container {
    padding: 20px 40px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    display: inline-block;
  }
  @media (max-width: 768px) {
    .grid-container { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <h1>✨ "THE 복지" 하이브리드 SVG 로고 시안 6종 (피드백 반영)</h1>
  <div class="grid-container">
    ${svgsHtml}
  </div>
</body>
</html>`;

const outPath = path.join(__dirname, 'public', 'logo_preview.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log('Preview generated at: ' + outPath);
