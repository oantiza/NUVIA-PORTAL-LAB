from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


if len(sys.argv) != 4:
    raise SystemExit("Uso: create-youtube-thumbnail.py <fondo.png> <logo.png> <salida.png>")

background_path, _logo_path, output_path = map(Path, sys.argv[1:])
canvas = Image.open(background_path).convert("RGB").resize((1280, 720), Image.Resampling.LANCZOS)
canvas = ImageEnhance.Contrast(canvas).enhance(1.06)

# Refuerzo oscuro únicamente detrás de la tipografía.
overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
pixels = overlay.load()
for x in range(760):
    alpha = int(154 * max(0, 1 - (x / 760) ** 2.35))
    for y in range(720):
        pixels[x, y] = (3, 14, 29, alpha)
canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)

draw = ImageDraw.Draw(canvas)
font_dir = Path(__file__).resolve().parents[1] / "output" / "videos" / "video-01-seguridad-estabilidad" / "04-assets" / "fonts"
inter = font_dir / "Inter-Variable.ttf"

def font(size: int):
    return ImageFont.truetype(str(inter), size=size)

def tracking_text(position, text, face, fill, tracking):
    x, y = position
    for char in text:
        draw.text((x, y), char, font=face, fill=fill, stroke_width=0)
        x += draw.textlength(char, font=face) + tracking

ivory = "#FAF7EE"
gold = "#E4B96A"
muted = "#B8C2D1"

# Marca discreta coherente con las miniaturas existentes.
tracking_text((58, 42), "NUVIA ACADEMY", font(20), ivory, 3.2)
draw.rounded_rectangle((58, 90, 304, 130), radius=8, fill="#B69152")
tracking_text((78, 98), "CAPÍTULO 01", font(18), "#07182C", 2.1)

# Promesa principal: dos líneas, legible incluso en móvil.
draw.text((54, 172), "SEGÚN EL", font=font(82), fill=ivory, stroke_width=1, stroke_fill="#07182C")
draw.text((50, 258), "PLAZO", font=font(152), fill=gold, stroke_width=2, stroke_fill="#07182C")

draw.rectangle((58, 445, 156, 451), fill=gold)
draw.text((58, 478), "EFECTIVO · DEPÓSITOS", font=font(27), fill=ivory)
draw.text((58, 518), "LETRAS · BONOS", font=font(27), fill=ivory)

output_path.parent.mkdir(parents=True, exist_ok=True)
canvas.convert("RGB").save(output_path, "PNG", optimize=True)
print(output_path)
