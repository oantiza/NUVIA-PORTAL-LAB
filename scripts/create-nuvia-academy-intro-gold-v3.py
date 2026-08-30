from __future__ import annotations

import math
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "videos" / "google-flow-intro-outro"
SYMBOL = ROOT / "src" / "assets" / "brand" / "nuvia-family-wealth-exact-2026-v2" / "nuvia-symbol-three-leaves-transparent.png"

W, H, FPS, SECONDS = 1920, 1080, 30, 5
FRAMES = FPS * SECONDS
NAVY = (3, 16, 38)
NAVY_LIGHT = (13, 43, 79)
GOLD = (213, 172, 91)
GOLD_LIGHT = (249, 224, 158)
GOLD_DARK = (91, 58, 21)
IVORY = (247, 243, 232)

FONT_SERIF = "C:/Windows/Fonts/georgia.ttf"
FONT_SANS = "C:/Windows/Fonts/segoeui.ttf"


def clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


def smoothstep(a: float, b: float, x: float) -> float:
    t = clamp((x - a) / (b - a))
    return t * t * (3 - 2 * t)


def ease_out_quint(t: float) -> float:
    return 1 - (1 - clamp(t)) ** 5


def make_background() -> Image.Image:
    yy, xx = np.mgrid[0:H, 0:W]
    cx, cy = W * 0.50, H * 0.40
    dist = np.sqrt(((xx - cx) / (W * 0.64)) ** 2 + ((yy - cy) / (H * 0.78)) ** 2)
    light = np.clip(1 - dist, 0, 1) ** 1.8
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    for channel in range(3):
        arr[:, :, channel] = np.clip(NAVY[channel] + (NAVY_LIGHT[channel] - NAVY[channel]) * light, 0, 255)
    arr[:, :, 3] = 255
    bg = Image.fromarray(arr, "RGBA")

    # Restrained gold horizon and architectural arcs.
    ornament = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ornament)
    d.line((180, 900, 1740, 900), fill=GOLD + (25,), width=1)
    d.arc((310, -750, 1610, 550), 22, 158, fill=GOLD + (22,), width=2)
    d.arc((435, -625, 1485, 425), 25, 155, fill=GOLD + (14,), width=1)
    for x in (340, 1580):
        d.line((x, 170, x, 850), fill=GOLD + (16,), width=1)
    return Image.alpha_composite(bg, ornament)


def gold_face(source: Image.Image, size: tuple[int, int], back: bool) -> Image.Image:
    alpha = source.resize(size, Image.Resampling.LANCZOS).getchannel("A")
    if back:
        color = GOLD_DARK
        face = Image.new("RGBA", size, color + (255,))
    else:
        # Vertical metallic gradient.
        w, h = size
        arr = np.zeros((h, w, 4), dtype=np.uint8)
        for y in range(h):
            p = y / max(1, h - 1)
            shine = 0.55 + 0.45 * math.sin((p * 1.35 + 0.10) * math.pi)
            arr[y, :, 0] = int(GOLD[0] + (GOLD_LIGHT[0] - GOLD[0]) * shine)
            arr[y, :, 1] = int(GOLD[1] + (GOLD_LIGHT[1] - GOLD[1]) * shine)
            arr[y, :, 2] = int(GOLD[2] + (GOLD_LIGHT[2] - GOLD[2]) * shine)
            arr[y, :, 3] = 255
        face = Image.fromarray(arr, "RGBA")
    face.putalpha(alpha)
    return face


def rotating_n(source: Image.Image, t: float) -> Image.Image:
    # Enters from the right while completing a 210-degree turn.
    progress = ease_out_quint(smoothstep(0.00, 0.62, t))
    angle = math.radians(150 + 210 * progress)
    c, s = math.cos(angle), math.sin(angle)
    base_h = 560
    base_w = int(source.width * base_h / source.height)
    visible_w = max(16, int(base_w * abs(c)))
    raw = ImageOps.mirror(source) if c < 0 else source
    face = gold_face(raw, (visible_w, base_h), c < 0)

    canvas = Image.new("RGBA", (850, 720), (0, 0, 0, 0))
    cx, cy = 425, 350
    depth = int(10 + abs(s) * 38)
    direction = 1 if s > 0 else -1
    side = Image.new("RGBA", face.size, GOLD_DARK + (255,))
    side.putalpha(face.getchannel("A"))
    for n in range(depth, 0, -2):
        canvas.alpha_composite(side, (cx - visible_w // 2 + direction * n, cy - base_h // 2 + n // 7))

    mask = Image.new("L", canvas.size, 0)
    mask.paste(face.getchannel("A"), (cx - visible_w // 2, cy - base_h // 2))
    halo_mask = mask.filter(ImageFilter.GaussianBlur(32)).point(lambda p: int(p * 0.34))
    halo = Image.new("RGBA", canvas.size, GOLD + (0,))
    halo.putalpha(halo_mask)
    canvas = Image.alpha_composite(canvas, halo)
    canvas.alpha_composite(face, (cx - visible_w // 2, cy - base_h // 2))

    # The object travels in from the right and gently settles.
    offset_x = int((1 - progress) * 430)
    scale = 0.88 + 0.12 * progress
    canvas = canvas.resize((int(canvas.width * scale), int(canvas.height * scale)), Image.Resampling.LANCZOS)
    positioned = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    positioned.alpha_composite(canvas, ((W - canvas.width) // 2 + offset_x, 105))
    return positioned


def particles(t: float) -> Image.Image:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(30):
        x = 170 + (i * 317) % 1580
        y = 160 + ((i * 149 - int(t * 24)) % 690)
        pulse = 0.5 + 0.5 * math.sin(i * 1.7 + t * 5)
        d.ellipse((x - 1, y - 1, x + 1, y + 1), fill=GOLD + (int(35 * pulse),))
    return layer


def frame(base: Image.Image, source: Image.Image, index: int) -> Image.Image:
    t = index / (FRAMES - 1)
    image = Image.alpha_composite(base.copy(), particles(t))
    image = Image.alpha_composite(image, rotating_n(source, t))

    text_alpha = smoothstep(0.60, 0.83, t)
    text = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(text)
    title_font = ImageFont.truetype(FONT_SERIF, 62)
    motto_font = ImageFont.truetype(FONT_SANS, 28)
    title = "NUVIA ACADEMY"
    motto = "Pensar con rigor, comunicar con humanidad"
    title_box = d.textbbox((0, 0), title, font=title_font)
    motto_box = d.textbbox((0, 0), motto, font=motto_font)
    title_x = (W - (title_box[2] - title_box[0])) // 2
    motto_x = (W - (motto_box[2] - motto_box[0])) // 2
    d.text((title_x, 755), title, font=title_font, fill=IVORY + (int(255 * text_alpha),))
    line_progress = ease_out_quint(smoothstep(0.64, 0.84, t))
    line_w = int(540 * line_progress)
    d.line((W // 2 - line_w // 2, 840, W // 2 + line_w // 2, 840), fill=GOLD + (int(220 * text_alpha),), width=2)
    d.text((motto_x, 865), motto, font=motto_font, fill=(221, 218, 208, int(235 * text_alpha)))
    image = Image.alpha_composite(image, text)

    fade = smoothstep(0.0, 0.07, t) * (1 - smoothstep(0.975, 1.0, t))
    if fade < 1:
        image = Image.alpha_composite(image, Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - fade)))))
    return image.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    base = make_background()
    source = Image.open(SYMBOL).convert("RGBA")
    versioned = OUT / "NUVIA-Academy-entradilla-oro-v3.mp4"
    final = OUT / "NUVIA-Academy-entradilla-final.mp4"
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ffmpeg, "-y", "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
           "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(versioned)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for i in range(FRAMES):
        proc.stdin.write(frame(base, source, i).tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError("No se pudo codificar la entradilla")
    final.write_bytes(versioned.read_bytes())
    preview = OUT / "preview-entradilla-oro-v3.png"
    subprocess.run([ffmpeg, "-y", "-ss", "3.8", "-i", str(versioned), "-frames:v", "1", "-update", "1", str(preview)], check=True)
    print(versioned)
    print(final)


if __name__ == "__main__":
    main()
