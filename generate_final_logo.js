const fs = require('fs');
const path = require('path');

const imgPath1 = path.join(__dirname, 'public', 'assets', 'symbol4_premium_blue.png');
const base64Image1 = fs.readFileSync(imgPath1, { encoding: 'base64' });
const dataUri1 = 'data:image/png;base64,' + base64Image1;

const mainBlue = '#137FEC';
const steelGray = '#64748B';

// 심볼은 높이 44px (100% 기준) -> y="8"부터 시작하므로 바닥은 8+44 = 52px.
// 텍스트 아래 정렬(Baseline)을 위해 y="50"으로 지정 (영문과 국문의 시각적 하단 일치).
const baselineY = 50;

const finalSvg = `<svg width="350" height="60" viewBox="0 0 350 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff');
      @import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_suit@1.0/SUIT-Heavy.woff2');
      /* THE 자간 추가 축소 (-3.3px) */
      .font-the { font-family: 'GmarketSansBold', sans-serif; font-weight: 700; fill: ${steelGray}; font-size: 31px; letter-spacing: -3.3px; }
      /* 복지 자간 */
      .font-bokji { font-family: 'SUIT-Heavy', sans-serif; font-weight: 900; fill: ${mainBlue}; font-size: 40px; letter-spacing: -1.5px; }
    </style>
  </defs>

  <!-- 3D 심볼 이미지: 110% 확대, y=4, 바닥 y=52 -->
  <image href="${dataUri1}" x="0" y="4" width="48" height="48" />
  
  <!-- 텍스트 베이스라인을 심볼 바닥 기준(50)에 동일하게 맞춤 (아래 정렬) -->
  <text x="53" y="${baselineY}">
    <!-- THE: 자간이 좁혀짐 -->
    <tspan class="font-the">THE</tspan>
    <!-- THE와 복지 사이 간격을 50% 추가로 좁힘 (dx=3.5) -->
    <tspan dx="3.5" class="font-bokji">복지</tspan>
  </text>
</svg>
`;

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>최종 하이브리드 로고 프리뷰 (수정본)</title>
<style>
  body { background-color: #f8fafc; padding: 50px; text-align: center; }
  .logo-container {
    padding: 30px;
    border: 1px dashed #cbd5e1;
    background: #ffffff;
    display: inline-block;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }
</style>
</head>
<body>
  <h1>✨ "THE 복지" 최종 로고 시안 (아래 정렬, 자간/단어간격 축소 패치)</h1>
  <div class="logo-container">
    ${finalSvg}
  </div>
</body>
</html>`;

const outSvgPath = path.join(__dirname, 'public', 'logo.svg');
const outPreviewPath = path.join(__dirname, 'public', 'logo_final_preview.html');

fs.writeFileSync(outSvgPath, finalSvg, 'utf-8');
fs.writeFileSync(outPreviewPath, html, 'utf-8');

console.log('Final Preview updated at: ' + outPreviewPath);
