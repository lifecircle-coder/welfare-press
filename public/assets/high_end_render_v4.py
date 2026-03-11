import time
from PIL import Image

def hex_to_rgb(hex_col):
    h = hex_col.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def blend_color(c1, c2, t):
    """Linear interpolation between two RGB colors."""
    return (
        int(c1[0] + (c2[0] - c1[0]) * t),
        int(c1[1] + (c2[1] - c1[1]) * t),
        int(c1[2] + (c2[2] - c1[2]) * t)
    )

def get_gradient_color(luminance):
    stops = [
        (0.00, hex_to_rgb('#0A1128')), 
        (0.20, hex_to_rgb('#0B2B6A')), 
        (0.40, hex_to_rgb('#115CD9')), 
        (0.60, hex_to_rgb('#137FEC')), 
        (0.80, hex_to_rgb('#69B1FF')), 
        (1.00, hex_to_rgb('#E6F2FF'))  
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
            if a > 0: 
                L = (0.299*r + 0.587*g + 0.114*b) / 255.0
                nr, ng, nb = get_gradient_color(L)
                pixels[x, y] = (nr, ng, nb, a)
                
    img.save(out_path, "PNG")
    print(f"Done in {time.time() - start:.2f}s")
    print(f"Saved Premium result to: {out_path}")

# USE symbol4.png
input_img = 'c:/Users/NCF_HY/Desktop/01.언론사프로젝트/welfare-press/public/assets/symbol4.png'
output_img = 'c:/Users/NCF_HY/Desktop/01.언론사프로젝트/welfare-press/public/assets/symbol4_premium_blue.png'

process_gradient_map(input_img, output_img)
