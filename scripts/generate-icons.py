import os
from PIL import Image, ImageDraw

sizes = [16, 32, 48, 128]
out_dir = "public/icons"
os.makedirs(out_dir, exist_ok=True)

for size in sizes:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer rounded rectangle background
    # Warm amber / chai theme: #d78939 -> RGB (215, 137, 57)
    # or deep terracotta gradient feel: #c56f2c
    bg_color = (205, 105, 40, 255)
    accent_color = (245, 180, 110, 255)
    white = (255, 255, 255, 255)
    
    pad = max(1, size // 16)
    radius = max(3, size // 4)
    
    draw.rounded_rectangle(
        [pad, pad, size - pad - 1, size - pad - 1],
        radius=radius,
        fill=bg_color
    )
    
    # Inner shape: A stylized tea cup or "IS" letters
    # For small sizes (16, 32): Draw clean "i" or lightbulb/cup
    # For all sizes: A clean coffee/tea cup with steam lines
    cx = size / 2.0
    cy = size / 2.0
    
    if size == 16:
        # Simplified icon: Clean white 'i'
        draw.rectangle([7, 3, 8, 4], fill=white)
        draw.rectangle([7, 6, 8, 12], fill=white)
        draw.rectangle([6, 6, 7, 7], fill=white)
        draw.rectangle([6, 12, 9, 12], fill=white)
    else:
        # Cup body
        cup_w = size * 0.44
        cup_h = size * 0.32
        cup_top = cy - (cup_h * 0.2)
        cup_bottom = cup_top + cup_h
        cup_left = cx - (cup_w * 0.55)
        cup_right = cup_left + cup_w
        
        # Cup rounded bottom
        draw.rounded_rectangle(
            [cup_left, cup_top, cup_right, cup_bottom],
            radius=int(cup_w * 0.35),
            fill=white
        )
        # Cup handle
        handle_w = max(2, int(size * 0.08))
        handle_left = cup_right - handle_w
        handle_right = cup_right + int(cup_w * 0.28)
        handle_top = cup_top + (cup_h * 0.15)
        handle_bottom = cup_bottom - (cup_h * 0.15)
        
        draw.arc([handle_left, handle_top, handle_right, handle_bottom], 270, 90, fill=white, width=handle_w)
        
        # Steam lines above cup
        steam_w = max(1, int(size * 0.04))
        # Left steam
        draw.line([cx - size * 0.12, cup_top - size * 0.18, cx - size * 0.08, cup_top - size * 0.06], fill=accent_color, width=steam_w)
        # Center steam
        draw.line([cx, cup_top - size * 0.24, cx, cup_top - size * 0.06], fill=white, width=steam_w)
        # Right steam
        draw.line([cx + size * 0.12, cup_top - size * 0.18, cx + size * 0.08, cup_top - size * 0.06], fill=accent_color, width=steam_w)

    img.save(f"{out_dir}/icon-{size}.png", "PNG")
    print(f"Generated {out_dir}/icon-{size}.png ({size}x{size})")

print("All icons generated successfully.")
