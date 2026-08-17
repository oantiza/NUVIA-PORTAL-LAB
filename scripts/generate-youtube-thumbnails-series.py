from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(r"C:\Users\oanti\Documents\NUVIA-PORTAL-LAB")
W, H = 1280, 720

IMPACT = Path(r"C:\Windows\Fonts\impact.ttf")
ARIAL_BLACK = Path(r"C:\Windows\Fonts\ariblk.ttf")
INTER = ROOT / "output/videos/video-01-seguridad-estabilidad/04-assets/fonts/Inter-Variable.ttf"

IVORY = (250, 247, 238)
GOLD = (232, 182, 85)
DEEP_NAVY = (2, 12, 27)


def font(path: Path, size: int):
    return ImageFont.truetype(str(path), size=size)


def tracked_text(draw, xy, text, face, fill, tracking=2.5):
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=face, fill=fill)
        x += draw.textlength(char, font=face) + tracking


def fit_font(text, max_width, start_size, min_size=30, face=IMPACT):
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    for size in range(start_size, min_size - 1, -1):
        candidate = font(face, size)
        box = probe.textbbox((0, 0), text, font=candidate, stroke_width=1)
        if box[2] - box[0] <= max_width:
            return candidate
    return font(face, min_size)


def darken_left(image):
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    px = overlay.load()
    for x in range(690):
        alpha = int(115 * max(0.0, 1.0 - (x / 690) ** 2.1))
        for y in range(H):
            px[x, y] = (*DEEP_NAVY, alpha)
    return Image.alpha_composite(image.convert("RGBA"), overlay)


def gold_text(base, xy, text, face, stroke=2):
    mask = Image.new("L", base.size, 0)
    md = ImageDraw.Draw(mask)
    md.text(xy, text, font=face, fill=255, stroke_width=stroke, stroke_fill=255)

    gradient = Image.new("RGB", base.size)
    gp = gradient.load()
    for y in range(H):
        t = y / H
        color = (int(255 - 56 * t), int(218 - 66 * t), int(126 - 43 * t))
        for x in range(W):
            gp[x, y] = color

    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    shadow_mask = mask.filter(ImageFilter.GaussianBlur(7))
    shadow.paste((0, 0, 0, 180), (3, 7), shadow_mask)
    base.alpha_composite(shadow)
    base.paste(gradient, (0, 0), mask)


def header(draw, chapter):
    tracked_text(draw, (58, 42), "NUVIA ACADEMY", font(INTER, 19), IVORY, 3.0)
    draw.rounded_rectangle((58, 91, 307, 134), radius=9, fill=(199, 156, 82, 255))
    tracked_text(draw, (79, 101), f"CAPÍTULO {chapter:02d}", font(INTER, 18), (6, 18, 35), 1.8)


def label(draw, center_x, y, text, accent=GOLD):
    face = fit_font(text, 170, 21, 16, INTER)
    box = draw.textbbox((0, 0), text, font=face)
    tw = box[2] - box[0]
    x0 = center_x - tw / 2 - 16
    x1 = center_x + tw / 2 + 16
    draw.rounded_rectangle((x0, y, x1, y + 38), radius=19,
                           fill=(2, 17, 37, 225), outline=(*accent, 225), width=2)
    draw.text((center_x, y + 7), text, font=face, fill=IVORY, anchor="ma")


def title_block(base, lines, gold_line, chapter):
    draw = ImageDraw.Draw(base, "RGBA")
    header(draw, chapter)
    y = 174
    for line, max_size in lines:
        face = fit_font(line, 525, max_size)
        draw.text((55, y), line, font=face, fill=IVORY,
                  stroke_width=2, stroke_fill=(1, 10, 22))
        box = draw.textbbox((55, y), line, font=face, stroke_width=2)
        y = box[3] + 2
    gold_face = fit_font(gold_line, 525, 58, face=ARIAL_BLACK)
    gold_text(base, (55, y + 20), gold_line, gold_face)


def save(image, output_dir, basename):
    output_dir.mkdir(parents=True, exist_ok=True)
    png = output_dir / f"{basename}.png"
    jpg = output_dir / f"{basename}.jpg"
    image.convert("RGB").save(png, "PNG", optimize=True)
    image.convert("RGB").save(jpg, "JPEG", quality=95, subsampling=0, optimize=True)
    return png, jpg


def build_chapter_1():
    source = ROOT / "output/videos/video-01-seguridad-estabilidad/10-youtube/NUVIA-AF01-miniatura-fondo-imagegen-v1.png"
    image = Image.open(source).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    image = darken_left(image)
    title_block(image, [("¿CUÁNDO LO", 82)], "NECESITAS?", 1)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((55, 491, 520, 499), radius=4, fill=GOLD)
    label(draw, 807, 615, "EFECTIVO")
    label(draw, 1000, 615, "DEPÓSITO")
    label(draw, 1174, 615, "LETRAS Y BONOS")
    out = ROOT / "output/videos/video-01-seguridad-estabilidad/10-youtube"
    return save(image, out, "NUVIA-AF01-portada-youtube-serie-final")


def build_chapter_2():
    source = ROOT / "output/videos/video-02-crecimiento-diversificacion/08-youtube/NUVIA-AF02-miniatura-fondo-cinematico-v2.png"
    image = Image.open(source).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    image = darken_left(image)
    title_block(image, [("ACCIONES,", 72), ("FONDOS O ETF", 72)], "¿QUÉ CAMBIA?", 2)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((55, 491, 520, 499), radius=4, fill=GOLD)
    label(draw, 610, 631, "ACCIÓN", (90, 170, 220))
    label(draw, 845, 631, "FONDO", (62, 190, 172))
    label(draw, 1120, 631, "ETF", (232, 182, 85))
    out = ROOT / "output/videos/video-02-crecimiento-diversificacion/08-youtube"
    return save(image, out, "NUVIA-AF02-portada-youtube-serie-final")


def build_chapter_3():
    source = ROOT / "output/videos/video-03-activos-complementarios/08-youtube/NUVIA-AF03-miniatura-fondo-cinematico-v2.png"
    image = Image.open(source).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    image = darken_left(image)
    title_block(image, [("¿QUÉ APORTA", 78)], "CADA UNO?", 3)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((55, 491, 520, 499), radius=4, fill=GOLD)
    draw.text((55, 535), "INMUEBLE · ORO", font=font(INTER, 24), fill=IVORY)
    draw.text((55, 578), "PENSIONES · CRIPTO", font=font(INTER, 24), fill=IVORY)
    out = ROOT / "output/videos/video-03-activos-complementarios/08-youtube"
    return save(image, out, "NUVIA-AF03-portada-youtube-serie-final")


if __name__ == "__main__":
    for pair in (build_chapter_1(), build_chapter_2(), build_chapter_3()):
        for path in pair:
            print(path)
