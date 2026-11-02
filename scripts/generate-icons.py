"""
Generates Idiot Summary extension icons.

Design: a warm gradient rounded square, a clean white chai cup on a saucer,
and three curling steam wisps. Rendered at high resolution (1024px), then
downsampled with LANCZOS for crisp anti-aliased icons at 16/32/48/128.
"""
import os
from PIL import Image, ImageDraw

SIZES = [16, 32, 48, 128]
OUT_DIR = "public/icons"
RENDER = 1024  # high-res canvas, downsampled for anti-aliasing

# Brand palette — warm chai tones
GRADIENT_TOP = (242, 164, 77)    # amber #F2A44D
GRADIENT_BOTTOM = (196, 88, 26)  # terracotta #C4581A
WHITE = (255, 255, 255)
CREAM = (255, 244, 230)          # warm cream for steam


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_background(size):
    """Rounded square with a vertical gradient."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(size):
        color = lerp(GRADIENT_TOP, GRADIENT_BOTTOM, y / size)
        gdraw.line([(0, y), (size, y)], fill=color + (255,))
    # Apply gradient inside a rounded-rect mask
    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    pad = size // 16
    mdraw.rounded_rectangle([pad, pad, size - pad - 1, size - pad - 1], radius=size // 4 - pad, fill=255)
    img.paste(grad, (0, 0), mask)
    return img


def bezier_points(p0, p1, p2, steps=40):
    """Quadratic bezier sampling."""
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts


def draw_stroke(draw, pts, color, width):
    """Draw a smooth thick curve by stamping circles along the path."""
    r = width / 2
    for (x, y) in pts:
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def draw_cup(img, s):
    """Draw cup silhouette: saucer, handle, body, and thin curling steam wisps."""
    draw = ImageDraw.Draw(img)
    white = WHITE + (255,)
    cream = CREAM + (255,)

    cx = RENDER / 2

    # ---- Saucer (pill under the cup, wider than the cup) ----
    saucer_top = 838
    draw.rounded_rectangle(
        [cx - 210, saucer_top, cx + 210, saucer_top + 54],
        radius=27,
        fill=white,
    )

    # ---- Handle (full ring stroked as arc; its left half is covered by the body) ----
    draw.ellipse(
        [cx + 30, 596, cx + 240, 784],
        outline=white,
        width=46,
    )

    # ---- Cup body (rounded, heavier curve at the bottom) ----
    cup_left = cx - 165
    cup_right = cx + 165
    cup_top = 500
    cup_bottom = 812
    draw.rounded_rectangle(
        [cup_left, cup_top, cup_right, cup_bottom],
        radius=48,
        fill=white,
    )
    draw.rounded_rectangle(
        [cup_left, cup_bottom - 100, cup_right, cup_bottom],
        radius=100,
        fill=white,
    )

    # ---- Steam wisps: three clean rounded vertical wisps of varying height ----
    base_y = 462
    wisp_w = 30
    for dx, height in [(-118, 108), (0, 174), (118, 108)]:
        draw.rounded_rectangle(
            [cx + dx - wisp_w / 2, base_y - height, cx + dx + wisp_w / 2, base_y],
            radius=wisp_w / 2,
            fill=cream,
        )


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # Render the full-detail icon once at high resolution
    hi = make_background(RENDER)
    draw_cup(hi, RENDER)

    for size in SIZES:
        resized = hi.resize((size, size), Image.LANCZOS)
        resized.save(f"{OUT_DIR}/icon-{size}.png", "PNG")
        print(f"Generated {OUT_DIR}/icon-{size}.png ({size}x{size})")

    # Also save the hi-res source for store listings
    hi.save(f"{OUT_DIR}/icon-512.png", "PNG")
    print(f"Generated {OUT_DIR}/icon-512.png (512x512 store asset)")
    print("All icons generated successfully.")


if __name__ == "__main__":
    main()
