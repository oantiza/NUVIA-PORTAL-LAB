from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.path import Path as MplPath
from matplotlib.patches import PathPatch


ROOT = Path(__file__).resolve().parents[1]
REFERENCE = Path(
    r"C:\Users\oanti\.codex\generated_images\01a00060-857a-7aa0-b890-22d4477ddc1b"
    r"\exec-b7721283-3026-42f4-b306-8c139b520d81.png"
)
OUT = ROOT / "src" / "assets" / "brand" / "nuvia-three-leaf-master"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = "#073766"
GREEN = "#5A7C2E"
CREAM = (250, 248, 242, 255)


def rdp(points, epsilon=0.62):
    """Ramer-Douglas-Peucker simplification for clean, compact SVG contours."""
    if len(points) < 3:
        return points
    start, end = points[0], points[-1]
    line = end - start
    length = np.hypot(line[0], line[1])
    if length == 0:
        distances = np.hypot(*(points - start).T)
    else:
        delta = points - start
        distances = np.abs(line[0] * delta[:, 1] - line[1] * delta[:, 0]) / length
    index = int(np.argmax(distances))
    maximum = distances[index]
    if maximum > epsilon:
        left = rdp(points[: index + 1], epsilon)
        right = rdp(points[index:], epsilon)
        return np.vstack((left[:-1], right))
    return np.vstack((start, end))


def mask_to_paths(mask):
    fig, ax = plt.subplots()
    contour = ax.contour(mask.astype(float), levels=[0.5])
    segments = contour.allsegs[0]
    plt.close(fig)
    paths = []
    for segment in segments:
        if len(segment) < 4:
            continue
        x = segment[:, 0]
        y = segment[:, 1]
        area = 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))
        if area < 6:
            continue
        closed = np.vstack((segment, segment[0]))
        simple = rdp(closed, 0.62)
        paths.append(simple)
    return paths


def svg_d(paths, offset_x, offset_y):
    commands = []
    for path in paths:
        first = path[0]
        commands.append(f"M {first[0] - offset_x:.2f} {first[1] - offset_y:.2f}")
        for point in path[1:]:
            commands.append(f"L {point[0] - offset_x:.2f} {point[1] - offset_y:.2f}")
        commands.append("Z")
    return " ".join(commands)


def branch_svg_d(offset_x, offset_y):
    def p(x, y):
        return f"{x - offset_x:.2f} {y - offset_y:.2f}"

    return " ".join([
        f"M {p(758, 780)}",
        f"C {p(750, 715)} {p(741, 648)} {p(742, 585)}",
        f"C {p(752, 548)} {p(756, 500)} {p(758, 457)}",
        f"C {p(761, 414)} {p(772, 371)} {p(778, 340)}",
        f"L {p(790, 340)}",
        f"C {p(783, 379)} {p(777, 419)} {p(774, 458)}",
        f"C {p(771, 505)} {p(772, 552)} {p(771, 585)}",
        f"C {p(774, 650)} {p(772, 716)} {p(758, 780)} Z",
        f"M {p(759, 458)}",
        f"C {p(756, 440)} {p(751, 421)} {p(750, 402)}",
        f"L {p(759, 402)}",
        f"C {p(765, 422)} {p(769, 438)} {p(773, 450)} Z",
        f"M {p(769, 458)}",
        f"C {p(780, 435)} {p(792, 411)} {p(801, 394)}",
        f"L {p(810, 396)}",
        f"C {p(797, 418)} {p(785, 444)} {p(776, 466)} Z",
    ])


def add_polygon_paths(ax, paths, offset_x, offset_y, color):
    for points in paths:
        vertices = [(x - offset_x, y - offset_y) for x, y in points]
        codes = [MplPath.MOVETO] + [MplPath.LINETO] * (len(vertices) - 2) + [MplPath.CLOSEPOLY]
        ax.add_patch(PathPatch(MplPath(vertices, codes), facecolor=color, edgecolor="none"))


def add_branch(ax, offset_x, offset_y):
    def shifted(points):
        return [(x - offset_x, y - offset_y) for x, y in points]

    shapes = [
        (
            shifted([
                (758, 780), (750, 715), (741, 648), (742, 585),
                (752, 548), (756, 500), (758, 457),
                (761, 414), (772, 371), (778, 340), (790, 340),
                (783, 379), (777, 419), (774, 458),
                (771, 505), (772, 552), (771, 585),
                (774, 650), (772, 716), (758, 780), (758, 780),
            ]),
            [MplPath.MOVETO, MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4,
             MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4,
             MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4, MplPath.LINETO,
             MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4,
             MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4,
             MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4, MplPath.CLOSEPOLY],
        ),
        (
            shifted([
                (759, 458), (756, 440), (751, 421), (750, 402), (759, 402),
                (765, 422), (769, 438), (773, 450), (759, 458),
            ]),
            [MplPath.MOVETO, MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4,
             MplPath.LINETO, MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4,
             MplPath.CLOSEPOLY],
        ),
        (
            shifted([
                (769, 458), (780, 435), (792, 411), (801, 394), (810, 396),
                (797, 418), (785, 444), (776, 466), (769, 458),
            ]),
            [MplPath.MOVETO, MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4,
             MplPath.LINETO, MplPath.CURVE4, MplPath.CURVE4, MplPath.CURVE4,
             MplPath.CLOSEPOLY],
        ),
    ]
    for vertices, codes in shapes:
        ax.add_patch(PathPatch(MplPath(vertices, codes), facecolor=NAVY, edgecolor="none"))


def render_master(width, height, x0, y0, navy_paths, green_paths, destination, background=None, margin=0):
    total_width, total_height = width + margin * 2, height + margin * 2
    fig = plt.figure(figsize=(total_width / 100, total_height / 100), dpi=100)
    fig.subplots_adjust(0, 0, 1, 1)
    if background:
        fig.patch.set_facecolor(background)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(-margin, width + margin)
    ax.set_ylim(height + margin, -margin)
    ax.set_aspect("equal")
    ax.axis("off")
    add_polygon_paths(ax, navy_paths, x0, y0, NAVY)
    add_branch(ax, x0, y0)
    add_polygon_paths(ax, green_paths, x0, y0, GREEN)
    fig.savefig(destination, dpi=100, transparent=background is None, facecolor=background or "none")
    plt.close(fig)


def main():
    source = Image.open(REFERENCE).convert("RGB")
    pixels = np.asarray(source).astype(np.int16)
    red, green_channel, blue = pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]

    green_mask = (
        (green_channel > red + 8)
        & (green_channel > blue + 10)
        & (green_channel < 205)
    )
    navy_mask = (
        (blue > green_channel + 8)
        & (green_channel > red + 5)
        & (blue < 205)
    )

    # Keep the crown and the upper lateral pair; remove only the two lower leaves.
    green_mask[405:545, 640:900] = False

    # Remove the raster branch completely; it will be rebuilt with smooth Bézier curves.
    navy_img = Image.fromarray((navy_mask * 255).astype(np.uint8))
    erase = ImageDraw.Draw(navy_img)
    erase.rectangle((742, 220, 900, 810), fill=0)
    navy_mask = np.asarray(navy_img) > 127

    # A very light optical cleanup removes raster stair-stepping without changing form.
    navy_mask = np.asarray(
        Image.fromarray((navy_mask * 255).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(0.72))
    ) > 104
    green_mask = np.asarray(
        Image.fromarray((green_mask * 255).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(0.72))
    ) > 104

    union = navy_mask | green_mask
    ys, xs = np.where(union)
    margin = 56
    x0 = max(0, int(xs.min()) - margin)
    y0 = max(0, int(ys.min()) - margin)
    x1 = min(source.width, int(xs.max()) + margin + 1)
    y1 = min(source.height, int(ys.max()) + margin + 1)
    width, height = x1 - x0, y1 - y0

    navy_paths = mask_to_paths(navy_mask)
    green_paths = mask_to_paths(green_mask)
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">
  <title id="title">NUVIA Family Wealth</title>
  <desc id="desc">Logotipo vertical con una N azul integrada con una rama de tres hojas verdes.</desc>
  <path fill="{NAVY}" fill-rule="evenodd" d="{svg_d(navy_paths, x0, y0)}"/>
  <path fill="{NAVY}" d="{branch_svg_d(x0, y0)}"/>
  <path fill="{GREEN}" fill-rule="evenodd" d="{svg_d(green_paths, x0, y0)}"/>
</svg>
'''
    (OUT / "nuvia-family-wealth-three-leaves-master.svg").write_text(svg, encoding="utf-8")

    render_master(
        width, height, x0, y0, navy_paths, green_paths,
        OUT / "nuvia-family-wealth-three-leaves-master.png",
    )
    render_master(
        width, height, x0, y0, navy_paths, green_paths,
        OUT / "vista-previa-master-tres-hojas.png",
        background="#FAF8F2", margin=80,
    )
    print(f"Master creado en {OUT}")


if __name__ == "__main__":
    main()
