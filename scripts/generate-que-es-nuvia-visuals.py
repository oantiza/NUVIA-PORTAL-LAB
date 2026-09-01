from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "visuales" / "que-es-nuvia"
ASSETS = ROOT / "src" / "assets"

NAVY = "#06172f"
NAVY_2 = "#0b2347"
NAVY_3 = "#15365f"
GREEN = "#4a5d23"
GREEN_SOFT = "#eef3df"
BRONZE = "#b69152"
BRONZE_SOFT = "#dcc59c"
PAPER = "#faf7ee"
PAPER_2 = "#f3eedf"
INK = "#152338"
MUTED = "#5f6a73"
WHITE = "#ffffff"

FONT_SERIF = Path("C:/Windows/Fonts/georgia.ttf")
FONT_SERIF_BOLD = Path("C:/Windows/Fonts/georgiab.ttf")
FONT_SANS = Path("C:/Windows/Fonts/segoeui.ttf")
FONT_SANS_BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")
FONT_SANS_ITALIC = Path("C:/Windows/Fonts/segoeuii.ttf")


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def cover(path: Path, size: tuple[int, int], centering=(0.5, 0.5)) -> Image.Image:
    with Image.open(path) as source:
        return ImageOps.fit(source.convert("RGB"), size, method=Image.Resampling.LANCZOS, centering=centering)


def fit_logo(path: Path, width: int) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGBA")
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, text_font, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=text_font)[2] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    text_font,
    fill: str,
    max_width: int,
    line_gap: int = 8,
    max_lines: int | None = None,
) -> int:
    x, y = xy
    lines = wrap_lines(draw, text, text_font, max_width)
    if max_lines is not None:
        lines = lines[:max_lines]
    ascent, descent = text_font.getmetrics()
    line_height = ascent + descent + line_gap
    for line in lines:
        draw.text((x, y), line, font=text_font, fill=fill)
        y += line_height
    return y


def alpha_gradient(size: tuple[int, int], horizontal=True, start=255, end=24) -> Image.Image:
    width, height = size
    mask = Image.new("L", size)
    d = ImageDraw.Draw(mask)
    extent = width if horizontal else height
    for point in range(extent):
        t = point / max(extent - 1, 1)
        alpha = round(start + (end - start) * (t ** 1.45))
        if horizontal:
            d.line((point, 0, point, height), fill=alpha)
        else:
            d.line((0, point, width, point), fill=alpha)
    return mask


def overlay_gradient(image: Image.Image, color: str, horizontal=True, start=255, end=24) -> Image.Image:
    result = image.convert("RGBA")
    layer = Image.new("RGBA", image.size, color)
    layer.putalpha(alpha_gradient(image.size, horizontal=horizontal, start=start, end=end))
    return Image.alpha_composite(result, layer).convert("RGB")


def rounded_panel(base: Image.Image, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None) -> None:
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=2 if outline else 1)


def paste_rgba(base: Image.Image, image: Image.Image, xy: tuple[int, int]) -> None:
    base.paste(image, xy, image if image.mode == "RGBA" else None)


def generate_infographic() -> Path:
    size = (1620, 2880)
    image = Image.new("RGB", size, PAPER)
    draw = ImageDraw.Draw(image)

    hero_h = 750
    hero = cover(
        ASSETS / "home" / "patrimonio-family-home-young-family-20260901.png",
        (1620, hero_h),
        centering=(0.68, 0.5),
    )
    hero = overlay_gradient(hero, NAVY, horizontal=True, start=255, end=18)
    image.paste(hero, (0, 0))
    logo = fit_logo(
        ASSETS / "brand" / "nuvia-family-wealth-exact-2026-v2" / "nuvia-family-wealth-horizontal-reversed.png",
        360,
    )
    paste_rgba(image, logo, (105, 72))
    draw.line((1215, 122, 1270, 122), fill=BRONZE_SOFT, width=2)
    draw.text((1290, 98), "EL MANIFIESTO", font=font(FONT_SANS_BOLD, 24), fill=BRONZE_SOFT)
    draw.text((108, 292), "¿Qué es", font=font(FONT_SERIF_BOLD, 94), fill=BRONZE_SOFT)
    draw.text((108, 386), "NUVIA?", font=font(FONT_SERIF_BOLD, 118), fill=WHITE)
    draw_wrapped(
        draw,
        (112, 552),
        "Un lugar donde las familias aprenden a entender su dinero.",
        font(FONT_SANS_BOLD, 40),
        WHITE,
        800,
        line_gap=6,
    )

    purpose_y = 750
    draw.rectangle((0, purpose_y, 1620, 1190), fill=PAPER)
    draw.line((110, 840, 172, 840), fill=GREEN, width=2)
    draw.text((192, 818), "EL PROPÓSITO", font=font(FONT_SANS_BOLD, 22), fill=GREEN)
    draw.text((110, 875), "Para qué", font=font(FONT_SERIF_BOLD, 72), fill=INK)
    draw.text((110, 950), "existe", font=font(FONT_SERIF_BOLD, 72), fill=INK)
    draw.text((112, 1045), "Criterio propio", font=font(FONT_SERIF, 45), fill=GREEN)
    purpose_text = "Para comprender el patrimonio familiar, valorar las opciones disponibles y afrontar las decisiones sin dejarse llevar por modas, mensajes comerciales o respuestas prefabricadas."
    draw_wrapped(draw, (690, 850), purpose_text, font(FONT_SANS, 31), INK, 800, line_gap=12)
    for index, label in enumerate(("COMPRENDER", "VALORAR", "DECIDIR")):
        x = 690 + index * 275
        draw.line((x, 1048, x + 248, 1048), fill=BRONZE, width=3)
        draw.text((x + 10, 1076), label, font=font(FONT_SANS_BOLD, 23), fill=NAVY)

    world_y = 1190
    draw.rectangle((0, world_y, 1960, 1880), fill=PAPER_2)
    draw.line((110, 1280, 172, 1280), fill=GREEN, width=2)
    draw.text((192, 1258), "EL UNIVERSO NUVIA", font=font(FONT_SANS_BOLD, 22), fill=GREEN)
    draw.text((110, 1320), "Cinco puertas", font=font(FONT_SERIF_BOLD, 70), fill=INK)
    draw_wrapped(
        draw,
        (1030, 1285),
        "Información, formación y herramientas para comprender mejor la economía familiar y el patrimonio.",
        font(FONT_SANS, 26),
        MUTED,
        470,
        line_gap=9,
    )
    doors = [
        ("01", "Economía y mercados", "El contexto económico explicado en lenguaje claro."),
        ("02", "Patrimonio", "Vivienda, impuestos, jubilación y coste de vida."),
        ("03", "Academia NUVIA", "Conceptos, cursos y materiales a tu ritmo."),
        ("04", "Analítica de cartera", "Composición, riesgo y escenarios explicados con datos."),
        ("05", "Lecturas con criterio", "Historias e ideas de interés duradero."),
    ]
    card_y = 1462
    gap = 20
    card_w = 264
    for i, (number, title, description) in enumerate(doors):
        x = 110 + i * (card_w + gap)
        rounded_panel(image, (x, card_y, x + card_w, 1795), 28, PAPER, "#d7d2c4")
        d = ImageDraw.Draw(image)
        d.text((x + 30, card_y + 32), number, font=font(FONT_SERIF, 42), fill=BRONZE)
        title_end = draw_wrapped(d, (x + 30, card_y + 115), title, font(FONT_SERIF_BOLD, 29), NAVY, card_w - 58, line_gap=3, max_lines=2)
        draw_wrapped(d, (x + 30, max(title_end + 32, card_y + 235)), description, font(FONT_SANS, 20), MUTED, card_w - 58, line_gap=6, max_lines=4)

    values_y = 1880
    draw.rectangle((0, values_y, 1620, 2460), fill=NAVY)
    draw.line((110, 1972, 172, 1972), fill=BRONZE_SOFT, width=2)
    draw.text((192, 1950), "LA MANERA DE HACER", font=font(FONT_SANS_BOLD, 22), fill=BRONZE_SOFT)
    draw.text((110, 2010), "Nuestro espíritu", font=font(FONT_SERIF_BOLD, 67), fill=WHITE)
    values = [
        ("Cl", "Claridad.", "Lo que no se entiende todavía no está listo.", PAPER, INK),
        ("Ho", "Honestidad.", "Supuestos, límites e incertidumbre siempre visibles.", GREEN, WHITE),
        ("In", "Independencia.", "Sin venta de productos, órdenes ni derivación comercial.", "#7a5c27", WHITE),
        ("Rp", "Respeto profesional.", "Aprender no sustituye el asesoramiento personalizado.", NAVY_3, WHITE),
    ]
    value_y = 2120
    value_w = 331
    for i, (mark, title, description, fill, text_color) in enumerate(values):
        x = 110 + i * (value_w + 26)
        rounded_panel(image, (x, value_y, x + value_w, 2395), 28, fill, "#315174" if i == 3 else None)
        d = ImageDraw.Draw(image)
        d.text((x + 30, value_y + 26), mark, font=font(FONT_SERIF, 42), fill="#9ca39f" if i == 0 else "#c8cab8")
        title_end = draw_wrapped(d, (x + 30, value_y + 116), title, font(FONT_SERIF_BOLD, 29), text_color, value_w - 60, line_gap=2, max_lines=2)
        draw_wrapped(d, (x + 30, title_end + 24), description, font(FONT_SANS, 19), text_color, value_w - 60, line_gap=5, max_lines=4)

    draw.rectangle((0, 2460, 1620, 2880), fill=PAPER)
    halo = Image.new("RGBA", (650, 330), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    for radius in range(300, 20, -8):
        alpha = max(0, round(1.2 * (300 - radius)))
        hd.ellipse((325 - radius, 165 - radius // 2, 325 + radius, 165 + radius // 2), fill=(185, 204, 139, min(alpha, 20)))
    paste_rgba(image, halo, (485, 2470))
    d = ImageDraw.Draw(image)
    line1 = "NUVIA informa, explica y calcula."
    line2 = "Tú comprendes y decides."
    f1 = font(FONT_SERIF, 55)
    f2 = font(FONT_SERIF, 59)
    x1 = (1620 - d.textbbox((0, 0), line1, font=f1)[2]) // 2
    x2 = (1620 - d.textbbox((0, 0), line2, font=f2)[2]) // 2
    d.text((x1, 2530), line1, font=f1, fill=NAVY)
    d.text((x2, 2605), line2, font=f2, fill=GREEN)
    d.line((760, 2692, 860, 2692), fill=BRONZE, width=3)
    note = "No hace falta saber de finanzas para empezar. Basta con una pregunta cercana y la voluntad de entenderla mejor."
    lines = wrap_lines(d, note, font(FONT_SANS, 22), 920)
    y = 2720
    for line in lines:
        w = d.textbbox((0, 0), line, font=font(FONT_SANS, 22))[2]
        d.text(((1620 - w) // 2, y), line, font=font(FONT_SANS, 22), fill=MUTED)
        y += 33
    disclaimer = "Contenido educativo e informativo. No constituye asesoramiento financiero, fiscal o jurídico personalizado."
    fdisc = font(FONT_SANS_ITALIC, 15)
    dw = d.textbbox((0, 0), disclaimer, font=fdisc)[2]
    d.text(((1620 - dw) // 2, 2827), disclaimer, font=fdisc, fill="#6b747b")

    target = OUT / "infografia-que-es-nuvia.png"
    image.save(target, format="PNG", optimize=True)
    return target


def generate_storyboard() -> Path:
    page_path = OUT / "pagina-completa-que-es-nuvia.png"
    if not page_path.exists():
        raise FileNotFoundError(
            "Falta pagina-completa-que-es-nuvia.png. Genera primero la captura de la página."
        )

    with Image.open(page_path) as source:
        page = source.convert("RGB")

    width, height = 2880, 1620
    image = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, width, height), fill=PAPER)
    draw.text((82, 70), "¿Qué es NUVIA?", font=font(FONT_SERIF_BOLD, 76), fill=NAVY)
    draw.text(
        (770, 96),
        "DE PÁGINA A VÍDEO · STORYBOARD DE REALIZACIÓN",
        font=font(FONT_SANS_BOLD, 22),
        fill=MUTED,
    )
    logo = fit_logo(
        ASSETS / "brand" / "nuvia-family-wealth-exact-2026-v2" / "nuvia-family-wealth-horizontal-transparent.png",
        350,
    )
    paste_rgba(image, logo, (2440, 72))
    draw.line((82, 185, 2798, 185), fill="#d7d2c4", width=2)

    gap = 24
    left = 82
    top = 222
    card_w = 661
    card_h = 600
    frame_h = 418
    scenes: list[tuple[str, str, str, str, int]] = [
        ("01", "00:00–00:05", "Apertura", "Fundido desde azul NUVIA. Entrada lenta sobre el hero.", 0),
        ("02", "00:05–00:11", "Una convicción", "Desplazamiento vertical suave. La frase aparece por bloques.", 769),
        ("03", "00:11–00:17", "El propósito", "La cámara se detiene en «criterio propio».", 1652),
        ("04", "00:17–00:23", "Mirada de largo plazo", "Zoom lento sobre la escena familiar y la cita.", 2321),
        ("05", "00:23–00:31", "Cinco puertas", "Barrido vertical. Cada puerta entra de forma secuencial.", 3041),
        ("06", "00:31–00:39", "Nuestro espíritu", "Las cuatro tarjetas aparecen una a una.", 4343),
        ("07", "00:39–00:44", "El principio", "Pausa visual. El lema ocupa toda la pantalla.", 5610),
        ("08", "00:44–00:52", "Cierre", "Logo, «NUVIA crece contigo» y fundido a azul.", 6230),
    ]

    source_frame_h = 800
    for i, (number, timing, title, direction, source_y) in enumerate(scenes):
        row, col = divmod(i, 4)
        x = left + col * (card_w + gap)
        y = top + row * (card_h + gap)

        source_y = min(source_y, max(0, page.height - source_frame_h))
        page_crop = page.crop((0, source_y, page.width, source_y + source_frame_h))
        frame = page_crop.resize((card_w, frame_h), Image.Resampling.LANCZOS)
        panel = Image.new("RGB", (card_w, card_h), NAVY)
        panel.paste(frame, (0, 0))
        ImageDraw.Draw(panel).line((0, frame_h, card_w, frame_h), fill=BRONZE, width=3)

        mask = Image.new("L", (card_w, card_h), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, card_w, card_h), radius=28, fill=255)
        image.paste(panel, (x, y), mask)
        d = ImageDraw.Draw(image)
        number_font = font(FONT_SERIF_BOLD, 31)
        d.ellipse((x + 25, y + 439, x + 83, y + 497), outline="#d9dfd1", width=2)
        nb = d.textbbox((0, 0), number, font=number_font)
        d.text(
            (x + 54 - (nb[2] - nb[0]) // 2, y + 451),
            number,
            font=number_font,
            fill=WHITE,
        )
        d.text((x + 103, y + 442), timing, font=font(FONT_SANS_BOLD, 17), fill=BRONZE_SOFT)
        d.text((x + 103, y + 468), title, font=font(FONT_SERIF_BOLD, 31), fill=WHITE)
        d.text((x + 25, y + 516), "MOVIMIENTO / TRANSICIÓN", font=font(FONT_SANS_BOLD, 13), fill="#9eafc2")
        draw_wrapped(
            d,
            (x + 25, y + 541),
            direction,
            font(FONT_SANS, 18),
            WHITE,
            card_w - 50,
            line_gap=4,
            max_lines=2,
        )

    footer_y = 1470
    draw.line((82, footer_y, 2798, footer_y), fill="#d7d2c4", width=2)
    source_note = "Fotogramas construidos con la captura exacta de que-es-nuvia.html · Duración estimada: 52 s"
    draw.text((82, 1497), source_note, font=font(FONT_SANS_BOLD, 18), fill=GREEN)
    disclaimer = "Contenido educativo e informativo. No constituye asesoramiento financiero, fiscal o jurídico personalizado."
    draw.text((82, 1531), disclaimer, font=font(FONT_SANS, 17), fill=MUTED)
    motto = "La página, convertida en relato audiovisual."
    mw = draw.textbbox((0, 0), motto, font=font(FONT_SERIF_BOLD, 27))[2]
    draw.text((2798 - mw, 1511), motto, font=font(FONT_SERIF_BOLD, 27), fill=NAVY)

    target = OUT / "storyboard-que-es-nuvia.png"
    image.save(target, format="PNG", optimize=True)
    return target


def stitch_full_page() -> Path | None:
    capture_dir = ROOT / "tmp" / "que-es-nuvia-capture"
    manifest_path = capture_dir / "manifest.json"
    if not manifest_path.exists():
        return None

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    page_width = int(round(manifest["pageWidth"]))
    page_height = int(round(manifest["pageHeight"]))
    header_height = int(math.ceil(manifest["headerHeight"]))
    canvas = Image.new("RGB", (page_width, page_height), PAPER)
    covered = 0

    for index, item in enumerate(manifest["items"]):
        with Image.open(capture_dir / item["name"]) as source:
            segment = source.convert("RGB")
        segment = segment.crop((0, 0, min(page_width, segment.width), segment.height))
        scroll_y = float(item["scrollY"])
        if index == 0:
            source_top = 0
        else:
            source_top = max(header_height, int(round(covered - scroll_y)))
        if source_top >= segment.height:
            continue
        take = min(segment.height - source_top, page_height - covered)
        if take <= 0:
            break
        crop = segment.crop((0, source_top, page_width, source_top + take))
        canvas.paste(crop, (0, covered))
        covered += take
        if covered >= page_height:
            break

    if covered < page_height:
        missing = page_height - covered
        if missing > header_height or not manifest["items"]:
            raise RuntimeError(f"Captura incompleta: {covered} de {page_height} px")
        last_path = capture_dir / manifest["items"][-1]["name"]
        with Image.open(last_path) as source:
            tail_source = source.convert("RGB").crop((0, 0, page_width, source.height))
        tail = tail_source.crop((0, tail_source.height - missing, page_width, tail_source.height))
        canvas.paste(tail, (0, covered))
        covered += missing

    target = OUT / "pagina-completa-que-es-nuvia.png"
    canvas.save(target, format="PNG", optimize=True)
    return target


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    page_target = stitch_full_page()
    targets: list[Path | None] = [generate_infographic(), page_target, generate_storyboard()]
    for target in targets:
        if target is not None:
            print(target)


if __name__ == "__main__":
    main()
