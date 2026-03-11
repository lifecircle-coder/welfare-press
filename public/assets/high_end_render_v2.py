import time
from PIL import Image

def hex_to_rgb(hex_col):
    h = hex_col.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def blend_color(c1, c2, t):
    """Linear interpolation between two RGB colors."""
    # 개선: 부드러운 전환을 위해 ease-in-out 형태의 곡선을 줄 수도 있지만, 여기선 자연스러운 선형 보간 사용
    return (
        int(c1[0] + (c2[0] - c1[0]) * t),
        int(c1[1] + (c2[1] - c1[1]) * t),
        int(c1[2] + (c2[2] - c1[2]) * t)
    )

def get_gradient_color(luminance):
    """
    명도(Luminance)에 따라 색상을 매핑합니다.
    사용자 피드백 반영: 오리지널처럼 색상(Hue) 자체가 명도에 따라 변하도록,
    블루 계열 안에서 딥 네이비(어두움) -> 로얄 블루 -> 브라이트 블루(밝음) -> 스카이블루로 색조를 다크하게/라이트하게 틉니다.
    """
    stops = [
        (0.00, hex_to_rgb('#0A1128')),  # 매우 어두운 딥 네이비 (원래의 어두운 보라색 역할)
        (0.20, hex_to_rgb('#0B2B6A')),  # 어두운 네이비 블루
        (0.40, hex_to_rgb('#115CD9')),  # 깊은 로얄 블루
        (0.60, hex_to_rgb('#137FEC')),  # 메인 컬러 (원래의 핑크빛 도는 메인 역할)
        (0.80, hex_to_rgb('#69B1FF')),  # 밝은 스카이 블루 (하이라이트 중간)
        (1.00, hex_to_rgb('#E6F2FF'))   # 반사광 (거의 흰색에 가까운 쿨 아이스 블루)
    ]
    
    for i in range(len(stops) - 1):
        if stops[i][0] <= luminance <= stops[i+1][0]:
            t = (luminance - stops[i][0]) / (stops[i+1][0] - stops[i][0])
            return blend_color(stops[i][1], stops[i+1][1], t)
            
    if luminance >= 1.0: return stops[-1][1]
    if luminance <= 0.0: return stops[0][1]

def process_gradient_map(img_path, out_path):
    start = time.time()
    print(f"Loading {img_path} for Premium Blue Rendering...")
    try:
        img = Image.open(img_path).convert("RGBA")
    except Exception as e:
        print(f"Error loading image: {e}")
        return

    pixels = img.load()
    width, height = img.size
    print(f"Applying Advanced Gradient Map to {width}x{height} image...")
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # 투명도(Alpha)가 아주 미세하게라도 있는 부분만 처리. 
            # 안티앨리어싱 경계를 전혀 훼손하지 않기 위해 a(Alpha) 값은 읽어온 그대로 다시 씁니다.
            if a > 0: 
                # 눈이 인식하는 실제 밝기(Perceptual Luminance) 계산 (0.0 ~ 1.0)
                # 원본의 어두운 4E3286과 밝은 BA3E6E의 명암 차이를 극대화하여 추출
                L = (0.299*r + 0.587*g + 0.114*b) / 255.0
                
                # 명도는 0.0 ~ 1.0 사이이지만, 실제 이미지의 피크 값에 따라 매핑하기 위해 약간의 보정 가능
                # 여기서는 오리지널 음영을 그대로 매핑
                nr, ng, nb = get_gradient_color(L)
                
                # Alpha는 원본 그대로 완벽하게 보존
                pixels[x, y] = (nr, ng, nb, a)
                
    img.save(out_path, "PNG")
    print(f"Done in {time.time() - start:.2f}s")
    print(f"Saved Premium result to: {out_path}")

input_img = 'c:/Users/NCF_HY/Desktop/01.언론사프로젝트/welfare-press/public/assets/symbol3.png'
output_img = 'c:/Users/NCF_HY/Desktop/01.언론사프로젝트/welfare-press/public/assets/symbol3_premium_blue.png'

process_gradient_map(input_img, output_img)
