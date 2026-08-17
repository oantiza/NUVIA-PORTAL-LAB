from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "assets" / "brand" / "nuvia-family-wealth-exact-2026-v2"
MASTER = OUT / "nuvia-family-wealth-horizontal-master-white.png"

NAVY = (7, 48, 91)
GREEN = (67, 116, 27)
GREEN_LIGHT = (185, 214, 103)
IVORY = (249, 246, 238)
CREAM = (250, 248, 242)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)


def extract_transparency(source: Image.Image) -> Image.Image:
    rgb = np.asarray(source.convert("RGB"), dtype=np.float32)
    background = np.array([254.0, 254.0, 254.0], dtype=np.float32)
    distance = np.linalg.norm(background - rgb, axis=2)
    alpha = np.clip((distance - 4.0) / 18.0 * 255.0, 0.0, 255.0)
    alpha[distance >= 22.0] = 255.0

    normalized = alpha / 255.0
    safe = np.maximum(normalized, 0.04)[:, :, None]
    foreground = background + (rgb - background) / safe
    foreground = np.clip(foreground, 0, 255).astype(np.uint8)

    rgba = np.dstack((foreground, alpha.astype(np.uint8)))
    return Image.fromarray(rgba, mode="RGBA")


def tight_crop(image: Image.Image, margin: int = 18) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 8)
    if not len(xs):
        raise RuntimeError("No se ha detectado contenido visible")
    left = max(0, int(xs.min()) - margin)
    top = max(0, int(ys.min()) - margin)
    right = min(image.width, int(xs.max()) + margin + 1)
    bottom = min(image.height, int(ys.max()) + margin + 1)
    return image.crop((left, top, right, bottom))


def fitted(image: Image.Image, box: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(box, Image.Resampling.LANCZOS)
    return copy


def recolor(image: Image.Image, navy: tuple[int, int, int], green: tuple[int, int, int]) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    red = rgba[:, :, 0]
    green_channel = rgba[:, :, 1]
    blue = rgba[:, :, 2]
    alpha = rgba[:, :, 3]
    green_pixels = (
        (green_channel > red * 1.08)
        & (green_channel > blue * 1.08)
        & (alpha > 0)
    )
    navy_pixels = (alpha > 0) & ~green_pixels
    rgba[green_pixels, :3] = green
    rgba[navy_pixels, :3] = navy
    return Image.fromarray(rgba, mode="RGBA")


def make_vertical(symbol: Image.Image, wordmark: Image.Image) -> Image.Image:
    symbol_display = fitted(symbol, (760, 650))
    wordmark_display = fitted(wordmark, (1220, 390))
    width = max(symbol_display.width, wordmark_display.width) + 180
    height = symbol_display.height + wordmark_display.height + 230
    canvas = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    canvas.alpha_composite(symbol_display, ((width - symbol_display.width) // 2, 60))
    wordmark_y = 100 + symbol_display.height
    canvas.alpha_composite(wordmark_display, ((width - wordmark_display.width) // 2, wordmark_y))
    return tight_crop(canvas, margin=36)


def make_mark(
    symbol: Image.Image,
    size: int,
    background: tuple[int, int, int],
    foreground_navy: tuple[int, int, int],
    foreground_green: tuple[int, int, int],
    rounded: bool = False,
) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(canvas)
    bounds = (0, 0, size - 1, size - 1)
    if rounded:
        draw.rounded_rectangle(bounds, radius=round(size * 0.2), fill=(*background, 255))
    else:
        draw.ellipse(bounds, fill=(*background, 255))
    mark = recolor(symbol, foreground_navy, foreground_green)
    mark = fitted(mark, (round(size * 0.68), round(size * 0.68)))
    canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas


def composite(image: Image.Image, background: tuple[int, int, int]) -> Image.Image:
    canvas = Image.new("RGBA", image.size, (*background, 255))
    canvas.alpha_composite(image)
    return canvas.convert("RGB")


def save_icon(source: Image.Image, size: int, destination: Path) -> None:
    source.resize((size, size), Image.Resampling.LANCZOS).save(destination, optimize=True)


def make_preview(horizontal: Image.Image, reversed_horizontal: Image.Image, vertical: Image.Image) -> None:
    width, height = 1800, 1480
    board = Image.new("RGB", (width, height), CREAM)
    draw = ImageDraw.Draw(board)
    draw.text((82, 62), "NUVIA FAMILY WEALTH", fill=NAVY, font=font(30, True))
    draw.text((82, 106), "Familia exacta derivada del máster aprobado", fill=(76, 91, 105), font=font(20))

    draw.rounded_rectangle((60, 170, 1740, 570), radius=28, fill=(255, 255, 255))
    draw.text((98, 200), "Horizontal original · fondos claros", fill=(76, 91, 105), font=font(18))
    horizontal_display = fitted(horizontal, (1500, 300))
    board.paste(horizontal_display, ((width - horizontal_display.width) // 2, 265), horizontal_display)

    draw.rounded_rectangle((60, 610, 1740, 1010), radius=28, fill=NAVY)
    draw.text((98, 640), "Horizontal invertido · fondos oscuros", fill=(222, 228, 232), font=font(18))
    reversed_display = fitted(reversed_horizontal, (1500, 300))
    board.paste(reversed_display, ((width - reversed_display.width) // 2, 705), reversed_display)

    draw.text((82, 1070), "Composición vertical y aplicaciones", fill=NAVY, font=font(24, True))
    vertical_display = fitted(vertical, (330, 330))
    board.paste(vertical_display, (90, 1120), vertical_display)

    x = 680
    for name in [
        "nuvia-mark-circle-light.png",
        "nuvia-mark-circle-navy.png",
        "nuvia-mark-rounded-light.png",
        "nuvia-youtube-profile-800.png",
    ]:
        mark = fitted(Image.open(OUT / name).convert("RGBA"), (190, 190))
        board.paste(mark, (x, 1170), mark)
        x += 250

    board.save(OUT / "vista-previa-familia-exacta-2026-v2.png", optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(MASTER).convert("RGB")
    transparent_full = extract_transparency(source)

    horizontal = tight_crop(transparent_full, margin=22)
    symbol = tight_crop(transparent_full.crop((150, 45, 790, 675)), margin=18)
    wordmark = tight_crop(transparent_full.crop((760, 250, 2040, 680)), margin=18)
    vertical = make_vertical(symbol, wordmark)

    horizontal.save(OUT / "nuvia-family-wealth-horizontal-transparent.png", optimize=True)
    symbol.save(OUT / "nuvia-symbol-three-leaves-transparent.png", optimize=True)
    wordmark.save(OUT / "nuvia-wordmark-family-wealth-transparent.png", optimize=True)
    vertical.save(OUT / "nuvia-family-wealth-vertical-transparent.png", optimize=True)
    composite(vertical, CREAM).save(OUT / "nuvia-family-wealth-vertical-master-ivory.png", quality=95, optimize=True)

    horizontal_reversed = recolor(horizontal, IVORY, GREEN_LIGHT)
    symbol_reversed = recolor(symbol, IVORY, GREEN_LIGHT)
    vertical_reversed = recolor(vertical, IVORY, GREEN_LIGHT)
    horizontal_reversed.save(OUT / "nuvia-family-wealth-horizontal-reversed.png", optimize=True)
    symbol_reversed.save(OUT / "nuvia-symbol-three-leaves-reversed.png", optimize=True)
    vertical_reversed.save(OUT / "nuvia-family-wealth-vertical-reversed.png", optimize=True)

    circle_light = make_mark(symbol, 1024, CREAM, NAVY, GREEN, rounded=False)
    circle_navy = make_mark(symbol, 1024, NAVY, IVORY, GREEN_LIGHT, rounded=False)
    circle_green = make_mark(symbol, 1024, GREEN, IVORY, IVORY, rounded=False)
    circle_black = make_mark(symbol, 1024, (8, 8, 8), IVORY, GREEN_LIGHT, rounded=False)
    rounded_light = make_mark(symbol, 1024, CREAM, NAVY, GREEN, rounded=True)
    rounded_navy = make_mark(symbol, 1024, NAVY, IVORY, GREEN_LIGHT, rounded=True)

    applications = {
        "nuvia-mark-circle-light.png": circle_light,
        "nuvia-mark-circle-navy.png": circle_navy,
        "nuvia-mark-circle-green.png": circle_green,
        "nuvia-mark-circle-black.png": circle_black,
        "nuvia-mark-rounded-light.png": rounded_light,
        "nuvia-mark-rounded-navy.png": rounded_navy,
    }
    for name, image in applications.items():
        image.save(OUT / name, optimize=True)

    save_icon(circle_light, 32, OUT / "nuvia-favicon-32.png")
    save_icon(circle_light, 48, OUT / "nuvia-favicon-48.png")
    save_icon(rounded_light, 180, OUT / "nuvia-apple-touch-icon-180.png")
    save_icon(rounded_light, 192, OUT / "nuvia-pwa-icon-192.png")
    save_icon(rounded_light, 512, OUT / "nuvia-pwa-icon-512.png")
    save_icon(circle_navy, 800, OUT / "nuvia-youtube-profile-800.png")

    make_preview(horizontal, horizontal_reversed, vertical)
    print(f"Familia exacta creada en {OUT}")


if __name__ == "__main__":
    main()
