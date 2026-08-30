from __future__ import annotations

import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps
import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "videos" / "google-flow-intro-outro"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
FPS = 30
DURATION = 5.0
FRAMES = int(FPS * DURATION)

NAVY = (6, 23, 47)
NAVY_2 = (10, 35, 71)
IVORY = (248, 244, 232)
GREEN = (150, 183, 72)
BRONZE = (194, 153, 86)
BRONZE_DARK = (105, 75, 37)

HERO_PATH = ROOT / "src" / "assets" / "home" / "hero-family-finance-compact.webp"
SYMBOL_PATH = ROOT / "src" / "assets" / "brand" / "nuvia-family-wealth-exact-2026-v2" / "nuvia-symbol-three-leaves-reversed.png"
WORDMARK_PATH = ROOT / "src" / "assets" / "brand" / "nuvia-family-wealth-exact-2026-v2" / "nuvia-family-wealth-horizontal-reversed.png"

FONT_SERIF = Path("C:/Windows/Fonts/georgia.ttf")
FONT_SERIF_BOLD = Path("C:/Windows/Fonts/georgiab.ttf")
FONT_SANS = Path("C:/Windows/Fonts/segoeui.ttf")
FONT_SANS_SEMIBOLD = Path("C:/Windows/Fonts/seguisb.ttf")


def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


def smoothstep(a: float, b: float, x: float) -> float:
    if a == b:
        return 1.0 if x >= b else 0.0
    t = clamp((x - a) / (b - a))
    return t * t * (3.0 - 2.0 * t)


def ease_out_cubic(t: float) -> float:
    t = clamp(t)
    return 1.0 - (1.0 - t) ** 3


def alpha_scaled(image: Image.Image, alpha: float) -> Image.Image:
    out = image.copy()
    a = out.getchannel("A").point(lambda p: int(p * clamp(alpha)))
    out.putalpha(a)
    return out


def cover_crop(image: Image.Image, x_center: float, zoom: float = 1.0) -> Image.Image:
    target_ratio = W / H
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        scaled_h = int(H * zoom)
        scaled_w = int(image.width * scaled_h / image.height)
    else:
        scaled_w = int(W * zoom)
        scaled_h = int(image.height * scaled_w / image.width)
    resized = image.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    crop_x = int(clamp(x_center) * max(0, scaled_w - W))
    crop_y = max(0, (scaled_h - H) // 2)
    return resized.crop((crop_x, crop_y, crop_x + W, crop_y + H))


def radial_glow(size: tuple[int, int], center: tuple[float, float], radius: float, color: tuple[int, int, int], opacity: float) -> Image.Image:
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    d = np.sqrt((xx - center[0]) ** 2 + (yy - center[1]) ** 2) / radius
    a = np.clip(1.0 - d, 0.0, 1.0) ** 2 * opacity
    arr = np.zeros((size[1], size[0], 4), dtype=np.uint8)
    arr[:, :, :3] = color
    arr[:, :, 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def graded_background(hero: Image.Image, x_center: float, zoom: float, family_side: bool) -> Image.Image:
    bg = cover_crop(hero, x_center, zoom).convert("RGB")
    bg = ImageEnhance.Contrast(bg).enhance(1.08)
    bg = ImageEnhance.Color(bg).enhance(0.55)
    bg = ImageEnhance.Brightness(bg).enhance(0.68)
    arr = np.asarray(bg).astype(np.float32)
    navy = np.array(NAVY, dtype=np.float32)
    arr = arr * 0.52 + navy * 0.48
    bg = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

    # Vignette and a clean reading field on the left.
    yy, xx = np.mgrid[0:H, 0:W]
    cx = W * (0.58 if family_side else 0.50)
    cy = H * 0.50
    dist = np.sqrt(((xx - cx) / (W * 0.78)) ** 2 + ((yy - cy) / (H * 0.90)) ** 2)
    vig = np.clip((dist - 0.25) / 0.85, 0, 1) * 115
    if family_side:
        vig += np.clip(1.0 - xx / (W * 0.72), 0, 1) * 60
    overlay = np.zeros((H, W, 4), dtype=np.uint8)
    overlay[:, :, :3] = (0, 9, 25)
    overlay[:, :, 3] = np.clip(vig, 0, 175).astype(np.uint8)
    bg = Image.alpha_composite(bg, Image.fromarray(overlay, "RGBA"))
    bg = Image.alpha_composite(bg, radial_glow((W, H), (W * 0.86, H * 0.17), W * 0.44, BRONZE, 0.24))
    return bg


def draw_tracking(draw: ImageDraw.ImageDraw, pos: tuple[int, int], text: str, font: ImageFont.FreeTypeFont, fill, tracking: int) -> None:
    x, y = pos
    for char in text:
        draw.text((x, y), char, font=font, fill=fill)
        x += int(draw.textlength(char, font=font)) + tracking


def tracked_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, tracking: int) -> int:
    return int(sum(draw.textlength(ch, font=font) + tracking for ch in text) - tracking)


def render_rotating_symbol(symbol: Image.Image, t: float) -> Image.Image:
    # A controlled 190-degree turn that settles front-facing.
    turn = ease_out_cubic(smoothstep(0.02, 0.66, t))
    angle = math.radians(170 + 190 * turn)
    c = math.cos(angle)
    s = math.sin(angle)
    base_h = 650
    base_w = int(symbol.width * base_h / symbol.height)
    face = symbol.resize((base_w, base_h), Image.Resampling.LANCZOS)
    if c < 0:
        face = ImageOps.mirror(face)
        tint = Image.new("RGBA", face.size, (42, 55, 69, 255))
        tint.putalpha(face.getchannel("A"))
        face = tint
    width = max(18, int(base_w * abs(c)))
    face = face.resize((width, base_h), Image.Resampling.LANCZOS)

    layer = Image.new("RGBA", (920, 840), (0, 0, 0, 0))
    cx, cy = 460, 410
    depth = int(10 + 32 * abs(s))
    direction = 1 if s >= 0 else -1
    alpha = face.getchannel("A")
    side = Image.new("RGBA", face.size, BRONZE_DARK + (255,))
    side.putalpha(alpha)
    for d in range(depth, 0, -2):
        px = cx - width // 2 + direction * d
        py = cy - base_h // 2 + int(d * 0.17)
        layer.alpha_composite(side, (px, py))

    # Soft sculptural halo and final face.
    halo = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    hm = Image.new("L", layer.size, 0)
    hm.paste(alpha, (cx - width // 2, cy - base_h // 2))
    hm = hm.filter(ImageFilter.GaussianBlur(24))
    halo_color = Image.new("RGBA", layer.size, BRONZE + (0,))
    halo_color.putalpha(hm.point(lambda p: int(p * 0.32)))
    layer = Image.alpha_composite(layer, halo_color)
    layer.alpha_composite(face, (cx - width // 2, cy - base_h // 2))

    # Fine highlight on the leading edge.
    if width > 30:
        edge = Image.new("RGBA", layer.size, (0, 0, 0, 0))
        ed = ImageDraw.Draw(edge)
        edge_x = cx + (width // 2 if direction > 0 else -width // 2)
        ed.line((edge_x, cy - 290, edge_x, cy + 285), fill=BRONZE + (150,), width=3)
        layer = Image.alpha_composite(layer, edge.filter(ImageFilter.GaussianBlur(1.2)))
    return layer


def particles_overlay(t: float) -> Image.Image:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for i in range(38):
        x = 80 + ((i * 263) % 1760)
        y0 = 120 + ((i * 137) % 820)
        y = (y0 - t * (18 + i % 7)) % 900 + 70
        r = 1 + (i % 3 == 0)
        pulse = 0.45 + 0.35 * math.sin(t * 5 + i)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=BRONZE + (int(55 * pulse),))
    return layer.filter(ImageFilter.GaussianBlur(0.45))


def intro_frame(base_bg: Image.Image, symbol: Image.Image, frame: int) -> Image.Image:
    t = frame / (FRAMES - 1)
    bg = base_bg.copy()

    # Architectural lines echo long-term perspective and avoid literal finance clichés.
    lines = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lines)
    for i in range(6):
        x = 90 + i * 95
        ld.line((x, H, 790 + i * 34, 90), fill=BRONZE + (18 + i * 4,), width=2)
    ld.arc((1110, -420, 2200, 690), 85, 180, fill=BRONZE + (52,), width=2)
    bg = Image.alpha_composite(bg, lines)
    bg = Image.alpha_composite(bg, particles_overlay(t))

    # Ground shadow and official mark.
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((170, 840, 890, 1010), fill=(0, 0, 0, 125))
    shadow = shadow.filter(ImageFilter.GaussianBlur(35))
    bg = Image.alpha_composite(bg, shadow)
    mark = render_rotating_symbol(symbol, t)
    scale_in = 0.92 + 0.08 * ease_out_cubic(smoothstep(0, 0.45, t))
    if scale_in != 1:
        mark = mark.resize((int(mark.width * scale_in), int(mark.height * scale_in)), Image.Resampling.LANCZOS)
    bg.alpha_composite(mark, (15, 108))

    # Typography appears only after the sculpture has nearly settled.
    a = smoothstep(0.50, 0.76, t) * (1 - smoothstep(0.97, 1.0, t) * 0.18)
    text_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(text_layer)
    eyebrow_font = ImageFont.truetype(str(FONT_SANS_SEMIBOLD), 26)
    title_font = ImageFont.truetype(str(FONT_SERIF), 86)
    motto_font = ImageFont.truetype(str(FONT_SANS), 29)
    x = 865
    draw_tracking(d, (x, 420), "NUVIA", eyebrow_font, GREEN + (int(255 * a),), 12)
    d.text((x, 465), "ACADEMY", font=title_font, fill=IVORY + (int(255 * a),))
    line_p = ease_out_cubic(smoothstep(0.58, 0.80, t))
    d.line((x, 590, x + int(470 * line_p), 590), fill=BRONZE + (int(230 * a),), width=3)
    d.text((x, 623), "Pensar con rigor, comunicar con humanidad", font=motto_font, fill=(226, 226, 217, int(235 * a)))
    bg = Image.alpha_composite(bg, text_layer)

    fade = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.985, 1.0, t))
    if fade < 1:
        black = Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - fade))))
        bg = Image.alpha_composite(bg, black)
    return bg.convert("RGB")


def outro_frame(base_bg: Image.Image, wordmark: Image.Image, frame: int) -> Image.Image:
    t = frame / (FRAMES - 1)
    bg = base_bg.copy()
    bg = Image.alpha_composite(bg, particles_overlay(t * 0.65))

    # A very subtle monumental N-shaped diagonal architecture in the reading field.
    geo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(geo)
    gd.line((90, 960, 90, 150), fill=BRONZE + (28,), width=2)
    gd.line((90, 150, 580, 955), fill=BRONZE + (24,), width=2)
    gd.line((580, 955, 580, 150), fill=BRONZE + (28,), width=2)
    gd.arc((1170, -470, 2280, 640), 92, 182, fill=BRONZE + (42,), width=2)
    bg = Image.alpha_composite(bg, geo)

    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    alpha_logo = smoothstep(0.05, 0.24, t)
    logo = wordmark.copy()
    logo.thumbnail((390, 150), Image.Resampling.LANCZOS)
    logo = alpha_scaled(logo, alpha_logo)
    layer.alpha_composite(logo, (116, 82))

    a1 = smoothstep(0.18, 0.42, t)
    a2 = smoothstep(0.35, 0.58, t)
    a3 = smoothstep(0.52, 0.72, t)
    eyebrow = ImageFont.truetype(str(FONT_SANS_SEMIBOLD), 25)
    headline = ImageFont.truetype(str(FONT_SERIF_BOLD), 66)
    sub = ImageFont.truetype(str(FONT_SANS), 30)
    disclaimer = ImageFont.truetype(str(FONT_SANS), 18)

    draw_tracking(d, (120, 286), "NUVIA ACADEMY", eyebrow, GREEN + (int(255 * a1),), 7)
    d.text((116, 338), "Suscríbete para", font=headline, fill=IVORY + (int(255 * a1),))
    d.text((116, 420), "seguir aprendiendo", font=headline, fill=IVORY + (int(255 * a1),))
    line_p = ease_out_cubic(smoothstep(0.28, 0.56, t))
    d.line((120, 527, 120 + int(590 * line_p), 527), fill=BRONZE + (int(235 * a2),), width=3)
    d.text((120, 565), "Nuevos capítulos de educación financiera", font=sub, fill=(232, 232, 221, int(245 * a2)))
    d.text((120, 616), "Conocimiento para decidir con calma y propósito.", font=sub, fill=GREEN + (int(240 * a3),))

    disc = "Contenido educativo. No constituye asesoramiento financiero, fiscal ni una recomendación personalizada de inversión."
    d.text((120, 1006), disc, font=disclaimer, fill=(223, 222, 213, int(185 * a3)))
    bg = Image.alpha_composite(bg, layer)

    fade = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.965, 1.0, t))
    if fade < 1:
        bg = Image.alpha_composite(bg, Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - fade)))))
    return bg.convert("RGB")


def encode(path: Path, frame_fn) -> None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [
        ffmpeg, "-y", "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-an",
        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(path),
    ]
    proc = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for i in range(FRAMES):
        proc.stdin.write(frame_fn(i).tobytes())
    proc.stdin.close()
    code = proc.wait()
    if code:
        raise RuntimeError(f"ffmpeg exited with status {code}")


def save_previews(intro_path: Path, outro_path: Path) -> None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for video, image in [
        (intro_path, OUT / "preview-entradilla-premium-v2.png"),
        (outro_path, OUT / "preview-salida-premium-v2.png"),
    ]:
        subprocess.run([ffmpeg, "-y", "-ss", "3.4", "-i", str(video), "-frames:v", "1", str(image)], check=True)


def main() -> None:
    hero = Image.open(HERO_PATH).convert("RGB")
    symbol = Image.open(SYMBOL_PATH).convert("RGBA")
    wordmark = Image.open(WORDMARK_PATH).convert("RGBA")
    intro_bg = graded_background(hero, 0.36, 1.05, False)
    outro_bg = graded_background(hero, 0.91, 1.05, True)
    intro_path = OUT / "NUVIA-Academy-entradilla-premium-v2.mp4"
    outro_path = OUT / "NUVIA-Academy-salida-premium-v2.mp4"
    encode(intro_path, lambda i: intro_frame(intro_bg, symbol, i))
    encode(outro_path, lambda i: outro_frame(outro_bg, wordmark, i))
    save_previews(intro_path, outro_path)
    print(intro_path)
    print(outro_path)


if __name__ == "__main__":
    main()
