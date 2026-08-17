from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
VECTOR_SOURCE = ROOT / "src" / "assets" / "brand" / "nuvia-2026-vector-v2"
ACTIVE_SOURCE = ROOT / "src" / "assets" / "brand" / "nuvia-three-leaf-final-2026"
OUT = ROOT / "src" / "assets" / "brand" / "nuvia-family-wealth-visible-2026-v1"

NAVY = (8, 46, 90)
GREEN_DARK = (63, 111, 31)
GREEN_LIGHT = (184, 211, 106)
IVORY = (248, 244, 234)
CREAM = (250, 248, 242)


def fitted(image: Image.Image, box: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(box, Image.Resampling.LANCZOS)
    return copy


def emphasize_descriptor(
    source: Path,
    destination: Path,
    threshold_y: int,
    target_center_y: int,
    scale_x: float = 1.06,
    scale_y: float = 1.90,
) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = np.asarray(image)
    red = pixels[:, :, 0]
    green = pixels[:, :, 1]
    blue = pixels[:, :, 2]
    alpha = pixels[:, :, 3]
    descriptor_pixels = (
        (green > red + 10)
        & (green > blue + 10)
        & (alpha > 0)
    )
    descriptor_pixels[:threshold_y, :] = False
    mask = Image.fromarray((descriptor_pixels * 255).astype(np.uint8), mode="L")
    detected_bbox = mask.getbbox()
    if not detected_bbox:
        raise RuntimeError(f"No se encontró el descriptor en {source}")
    bbox = (
        max(0, detected_bbox[0] - 8),
        max(0, detected_bbox[1] - 8),
        min(image.width, detected_bbox[2] + 8),
        min(image.height, detected_bbox[3] + 8),
    )

    descriptor_alpha = image.getchannel("A").crop(bbox)
    recolored = Image.new("RGBA", descriptor_alpha.size, (*GREEN_DARK, 0))
    recolored.putalpha(descriptor_alpha)

    cleared = Image.new("RGBA", image.size, (0, 0, 0, 0))
    cleared.paste(image, (0, 0))
    empty = Image.new("RGBA", descriptor_alpha.size, (0, 0, 0, 0))
    cleared.paste(empty, (bbox[0], bbox[1]))

    resized = recolored.resize(
        (round(recolored.width * scale_x), round(recolored.height * scale_y)),
        Image.Resampling.LANCZOS,
    )
    center_x = (bbox[0] + bbox[2]) // 2
    position = (center_x - resized.width // 2, target_center_y - resized.height // 2)
    cleared.alpha_composite(resized, position)
    cleared.save(destination, optimize=True)


def modified_svg(source: Path, destination: Path, transform: str, reversed_logo: bool = False) -> None:
    text = source.read_text(encoding="utf-8")
    text = text.replace(
        "*{stroke-linejoin: round; stroke-linecap: butt}",
        "*{stroke-linejoin: round; stroke-linecap: butt} "
        "#family_wealth_emphasis path{fill:#3f6f1f !important}",
        1,
    )
    text = text.replace(
        '   <g id="patch_14">',
        f'   <g id="family_wealth_emphasis" transform="{transform}">\n   <g id="patch_14">',
        1,
    )
    text = text.replace(
        "   </g>\n  </g>\n </g>\n <defs>",
        "   </g>\n   </g>\n  </g>\n </g>\n <defs>",
        1,
    )
    if reversed_logo:
        text = text.replace("#082e5a", "#f8f4ea")
        text = text.replace("#4e7b22", "#b8d36a")
        text = text.replace("#3f6f1f", "#b8d36a")
    destination.write_text(text, encoding="utf-8")


def reversed_png(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if not alpha:
                continue
            if green > red * 1.08 and green > blue * 1.08:
                pixels[x, y] = (*GREEN_LIGHT, alpha)
            else:
                pixels[x, y] = (*IVORY, alpha)
    image.save(destination, optimize=True)


def composite_on_background(source: Path, destination: Path, color: tuple[int, int, int]) -> None:
    logo = Image.open(source).convert("RGBA")
    background = Image.new("RGBA", logo.size, (*color, 255))
    background.alpha_composite(logo)
    background.convert("RGB").save(destination, quality=94, optimize=True)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)


def make_preview() -> None:
    width, height = 1800, 1380
    board = Image.new("RGB", (width, height), CREAM)
    draw = ImageDraw.Draw(board)
    draw.text((90, 68), "NUVIA FAMILY WEALTH", fill=NAVY, font=font(30, True))
    draw.text((90, 112), "Familia de marca · descriptor de alta legibilidad", fill=(80, 94, 107), font=font(20))

    cards = [
        ((70, 180, 1730, 590), (255, 255, 255), "Horizontal · fondos claros"),
        ((70, 625, 1730, 1025), NAVY, "Horizontal invertido · fondos oscuros"),
    ]
    for bounds, color, label in cards:
        draw.rounded_rectangle(bounds, radius=28, fill=color)
        label_color = (95, 105, 115) if color == (255, 255, 255) else (218, 224, 229)
        draw.text((bounds[0] + 38, bounds[1] + 28), label, fill=label_color, font=font(18))

    horizontal = fitted(Image.open(OUT / "nuvia-family-wealth-horizontal-transparent.png").convert("RGBA"), (1430, 300))
    board.paste(horizontal, ((width - horizontal.width) // 2, 275), horizontal)
    horizontal_reversed = fitted(Image.open(OUT / "nuvia-family-wealth-horizontal-reversed.png").convert("RGBA"), (1430, 285))
    board.paste(horizontal_reversed, ((width - horizontal_reversed.width) // 2, 720), horizontal_reversed)

    vertical = fitted(Image.open(OUT / "nuvia-family-wealth-vertical-transparent.png").convert("RGBA"), (250, 270))
    board.paste(vertical, (95, 1080), vertical)
    draw.text((390, 1100), "Vertical", fill=NAVY, font=font(22, True))
    draw.text((390, 1142), "Descriptor reforzado también en la composición apilada.", fill=(80, 94, 107), font=font(18))

    x = 1120
    for name in ["nuvia-mark-circle-navy.png", "nuvia-mark-rounded-light.png", "nuvia-favicon-48.png"]:
        mark = fitted(Image.open(OUT / name).convert("RGBA"), (150, 150))
        board.paste(mark, (x, 1110), mark)
        x += 185

    board.save(OUT / "vista-previa-familia-family-wealth-visible-2026-v1.png", optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    modified_svg(
        VECTOR_SOURCE / "nuvia-family-wealth-horizontal-v2.svg",
        OUT / "nuvia-family-wealth-horizontal.svg",
        "translate(935 278) scale(1.06 1.90) translate(-935 -295)",
    )
    modified_svg(
        VECTOR_SOURCE / "nuvia-family-wealth-horizontal-v2.svg",
        OUT / "nuvia-family-wealth-horizontal-reversed.svg",
        "translate(935 278) scale(1.06 1.90) translate(-935 -295)",
        reversed_logo=True,
    )
    modified_svg(
        VECTOR_SOURCE / "nuvia-family-wealth-vertical-v2.svg",
        OUT / "nuvia-family-wealth-vertical.svg",
        "translate(432 819) scale(1.06 1.90) translate(-432 -835)",
    )
    modified_svg(
        VECTOR_SOURCE / "nuvia-family-wealth-vertical-v2.svg",
        OUT / "nuvia-family-wealth-vertical-reversed.svg",
        "translate(432 819) scale(1.06 1.90) translate(-432 -835)",
        reversed_logo=True,
    )

    emphasize_descriptor(
        VECTOR_SOURCE / "nuvia-family-wealth-horizontal-v2.png",
        OUT / "nuvia-family-wealth-horizontal-transparent.png",
        threshold_y=700,
        target_center_y=772,
    )
    emphasize_descriptor(
        VECTOR_SOURCE / "nuvia-family-wealth-vertical-v2.png",
        OUT / "nuvia-family-wealth-vertical-transparent.png",
        threshold_y=2200,
        target_center_y=2275,
    )
    reversed_png(
        OUT / "nuvia-family-wealth-horizontal-transparent.png",
        OUT / "nuvia-family-wealth-horizontal-reversed.png",
    )
    reversed_png(
        OUT / "nuvia-family-wealth-vertical-transparent.png",
        OUT / "nuvia-family-wealth-vertical-reversed.png",
    )
    composite_on_background(
        OUT / "nuvia-family-wealth-vertical-transparent.png",
        OUT / "nuvia-family-wealth-vertical-master-ivory.png",
        CREAM,
    )

    shutil.copy2(VECTOR_SOURCE / "nuvia-symbol-three-leaves-v2.svg", OUT / "nuvia-symbol-three-leaves.svg")
    shutil.copy2(VECTOR_SOURCE / "nuvia-symbol-three-leaves-v2.png", OUT / "nuvia-symbol-three-leaves-transparent.png")

    reusable = [
        "nuvia-symbol-three-leaves-reversed.png",
        "nuvia-mark-circle-light.png",
        "nuvia-mark-circle-navy.png",
        "nuvia-mark-circle-green.png",
        "nuvia-mark-circle-black.png",
        "nuvia-mark-rounded-light.png",
        "nuvia-mark-rounded-navy.png",
        "nuvia-favicon-32.png",
        "nuvia-favicon-48.png",
        "nuvia-apple-touch-icon-180.png",
        "nuvia-pwa-icon-192.png",
        "nuvia-pwa-icon-512.png",
        "nuvia-youtube-profile-800.png",
    ]
    for name in reusable:
        shutil.copy2(ACTIVE_SOURCE / name, OUT / name)

    make_preview()
    print(f"Familia creada en {OUT}")


if __name__ == "__main__":
    main()
