from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "videos" / "google-flow-intro-outro"
LOGO = (
    ROOT
    / "src"
    / "assets"
    / "brand"
    / "nuvia-family-wealth-exact-2026-v2"
    / "nuvia-family-wealth-horizontal-transparent.png"
)

WIDTH, HEIGHT = 1280, 720

NAVY = (11, 35, 71, 255)
GREEN = (95, 122, 44, 255)
BRONZE = (182, 145, 82, 255)
COPY = (64, 80, 106, 255)
MUTED = (91, 100, 114, 255)
WHITE = (255, 255, 255, 255)
PAPER_GLASS = (250, 247, 238, 238)

FONT_REGULAR = Path(r"C:\Windows\Fonts\segoeui.ttf")
FONT_SEMIBOLD = Path(r"C:\Windows\Fonts\seguisb.ttf")


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def draw_bell(draw: ImageDraw.ImageDraw, x: int, y: int) -> None:
    # Campana de línea limpia, concebida para lectura a tamaño reducido.
    draw.arc((x + 7, y + 5, x + 39, y + 37), 190, 350, fill=WHITE, width=3)
    draw.line((x + 8, y + 20, x + 5, y + 34, x + 41, y + 34, x + 38, y + 20), fill=WHITE, width=3)
    draw.ellipse((x + 20, y + 38, x + 27, y + 45), fill=WHITE)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    panel = (40, 395, 1240, 690)
    draw.rounded_rectangle(panel, radius=24, fill=PAPER_GLASS, outline=(182, 145, 82, 150), width=2)

    logo = Image.open(LOGO).convert("RGBA")
    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)
    logo_width = 430
    logo_height = round(logo.height * logo_width / logo.width)
    logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, (70, 430))

    draw.text(
        (72, 561),
        "Pensar con rigor, comunicar con humanidad",
        font=font(FONT_REGULAR, 21),
        fill=COPY,
    )

    pill = (640, 438, 1200, 516)
    draw.rounded_rectangle(pill, radius=39, fill=NAVY)
    draw_bell(draw, 670, 454)
    draw.text(
        (727, 462),
        "Suscríbete para seguir aprendiendo",
        font=font(FONT_SEMIBOLD, 25),
        fill=WHITE,
    )
    draw.ellipse((658, 537, 668, 547), fill=GREEN)
    draw.text(
        (679, 532),
        "Nuevos capítulos de educación financiera",
        font=font(FONT_REGULAR, 19),
        fill=COPY,
    )

    draw.line((70, 610, 1210, 610), fill=(182, 145, 82, 170), width=2)
    disclaimer = (
        "Contenido educativo. No constituye asesoramiento financiero, fiscal ni una "
        "recomendación personalizada de inversión."
    )
    draw.text((72, 631), disclaimer, font=font(FONT_REGULAR, 15), fill=MUTED)

    canvas.save(OUT / "NUVIA-Academy-salida-overlay-oficial.png")


if __name__ == "__main__":
    main()
