import time
import colorsys
import os
from PIL import Image

def colorize(img_path, out_path, hex_col):
    start = time.time()
    print(f"Loading {img_path}...")
    try:
        img = Image.open(img_path).convert("RGBA")
    except Exception as e:
        print(f"Error loading image: {e}")
        return

    pixels = img.load()
    width, height = img.size
    print(f"Image size: {width}x{height}")
    
    # Target color to HSV
    h_hex = hex_col.lstrip('#')
    tr, tg, tb = tuple(int(h_hex[i:i+2], 16) for i in (0, 2, 4))
    th, ts, tv = colorsys.rgb_to_hsv(tr/255.0, tg/255.0, tb/255.0)
    
    print(f"Processing pixels to target hue: {th*360:.1f} degrees...")
    
    # Iterate and shift hue while preserving V (명도/어두움) and S (채도비율)
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0:
                h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
                # Apply target hue, keep original S and V for 3D effect
                # To make sure it looks rich, we can slightly mix target saturation if needed, 
                # but preserving original preserves exact shading map.
                nr, ng, nb = colorsys.hsv_to_rgb(th, s, v)
                pixels[x, y] = (int(nr*255), int(ng*255), int(nb*255), a)
                
    print("Saving processed image...")
    img.save(out_path, "PNG")
    print(f"Done in {time.time() - start:.2f}s")
    print(f"Saved to: {out_path}")

input_img = 'c:/Users/NCF_HY/Desktop/01.언론사프로젝트/welfare-press/public/assets/symbol.png'
output_img = 'c:/Users/NCF_HY/Desktop/01.언론사프로젝트/welfare-press/public/assets/symbol_blue.png'
target_color = '#137FEC'

colorize(input_img, output_img, target_color)
