import time
from PIL import Image

def hex_to_rgb(hex_col):
    h = hex_col.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def blend_color(c1, c2, t):
    """선형 보간(Linear interpolation)으로 두 색상을 부드럽게 섞습니다."""
    return (
        int(c1[0] + (c2[0] - c1[0]) * t),
        int(c1[1] + (c2[1] - c1[1]) * t),
        int(c1[2] + (c2[2] - c1[2]) * t)
    )

def get_gradient_color(luminance):
    """
    명도(0.0~1.0)에 따라 하이엔드 블루 그라데이션 맵의 색상을 반환합니다.
    - 0.0 (가장 어두운 그림자) : Deep Navy
    - 0.4 (중간 톤) : Main Blue (#137FEC)
    - 0.8 (밝은 톤) : Soft Blue
    - 1.0 (가장 밝은 반사광) : White
    """
    stops = [
        (0.00, hex_to_rgb('#0b1b36')), # 고급스러운 딥 네이비
        (0.35, hex_to_rgb('#137FEC')), # 브랜드 메인 블루
        (0.75, hex_to_rgb('#7bb6f7')), # 부드러운 스카이 블루
        (1.00, hex_to_rgb('#ffffff'))  # 반사광 화이트
    ]
    
    # 해당 명도가 속한 구간을 찾아 부드럽게 보간
    for i in range(len(stops) - 1):
        if stops[i][0] <= luminance <= stops[i+1][0]:
            t = (luminance - stops[i][0]) / (stops[i+1][0] - stops[i][0])
            return blend_color(stops[i][1], stops[i+1][1], t)
            
    if luminance >= 1.0: return stops[-1][1]
    if luminance <= 0.0: return stops[0][1]

def process_gradient_map(img_path, out_path):
    start = time.time()
    print(f"Loading {img_path} for High-End Rendering...")
    try:
        img = Image.open(img_path).convert("RGBA")
    except Exception as e:
        print(f"Error loading image: {e}")
        return

    pixels = img.load()
    width, height = img.size
    print(f"Applying Gradient Map to {width}x{height} image...")
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # 투명도(Alpha)가 있는 픽셀만 처리. Alpha 값은 절대 건드리지 않음(외곽선 픽셀화 방지)
            if a > 0: 
                # 눈이 인식하는 실제 밝기(Perceptual Luminance) 계산 (0.0 ~ 1.0)
                L = (0.299*r + 0.587*g + 0.114*b) / 255.0
                
                # 명도에 따른 새로운 색상 추출
                nr, ng, nb = get_gradient_color(L)
                
                # Alpha는 원본 그대로 유지
                pixels[x, y] = (nr, ng, nb, a)
                
    img.save(out_path, "PNG")
    print(f"Done in {time.time() - start:.2f}s")
    print(f"Saved High-end result to: {out_path}")

input_img = 'c:/Users/NCF_HY/Desktop/01.언론사프로젝트/welfare-press/public/assets/symbol.png'
output_img = 'c:/Users/NCF_HY/Desktop/01.언론사프로젝트/welfare-press/public/assets/symbol_highend.png'

process_gradient_map(input_img, output_img)
