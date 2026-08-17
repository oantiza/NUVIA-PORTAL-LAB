from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

ROOT = Path(r"C:\Users\oanti\Documents\NUVIA-PORTAL-LAB")
FONT = ROOT / "output/videos/video-02-crecimiento-diversificacion/04-assets/fonts/Inter-Variable.ttf"
W, H = 1280, 720
NAVY = (3, 17, 36)
GOLD = (230, 181, 89)
PAPER = (250, 247, 238)


def font(size, weight="regular"):
    # La fuente variable mantiene la identidad; Pillow utiliza su instancia predeterminada.
    return ImageFont.truetype(str(FONT), size=size)


def background():
    im = Image.new("RGB", (W, H), NAVY)
    px = im.load()
    for y in range(H):
        for x in range(W):
            glow = max(0.0, 1.0 - math.hypot((x-960)/720, (y-350)/530))
            edge = max(0.0, 1.0 - math.hypot((x-1050)/430, (y-390)/380))
            px[x, y] = (
                int(3 + 4*glow + 3*edge),
                int(17 + 14*glow + 5*edge),
                int(36 + 25*glow + 7*edge),
            )
    d = ImageDraw.Draw(im, "RGBA")
    # Rejilla editorial, restringida al campo de objetos.
    for x in range(700, 1260, 58):
        d.line((x, 80, x, 650), fill=(181, 145, 80, 24), width=1)
    for y in range(96, 660, 58):
        d.line((675, y, 1260, y), fill=(181, 145, 80, 24), width=1)
    # Arco de horizonte común a la serie.
    d.arc((520, -250, 1450, 690), 205, 345, fill=(230, 181, 89, 95), width=2)
    d.arc((530, -240, 1440, 680), 205, 345, fill=(230, 181, 89, 28), width=12)
    return im


def gold_text(base, xy, text, ft, anchor=None):
    mask = Image.new("L", base.size, 0)
    md = ImageDraw.Draw(mask)
    md.text(xy, text, font=ft, fill=255, anchor=anchor)
    grad = Image.new("RGB", base.size)
    gp = grad.load()
    for y in range(H):
        t = y / H
        col = (int(247-50*t), int(207-65*t), int(117-38*t))
        for x in range(W):
            gp[x, y] = col
    base.paste(grad, (0, 0), mask)


def fit_asset(path, box):
    im = Image.open(path).convert("RGBA")
    a = im.getchannel("A")
    bbox = a.getbbox()
    if bbox:
        im = im.crop(bbox)
    im.thumbnail(box, Image.Resampling.LANCZOS)
    return im


def paste_asset(base, path, center, box, glow=(230,181,89,90)):
    obj = fit_asset(path, box)
    x = int(center[0] - obj.width/2)
    y = int(center[1] - obj.height/2)
    alpha = obj.getchannel("A")
    halo = Image.new("RGBA", base.size, (0,0,0,0))
    colored = Image.new("RGBA", obj.size, glow)
    halo.paste(colored, (x, y), alpha)
    halo = halo.filter(ImageFilter.GaussianBlur(28))
    base.alpha_composite(halo)
    shadow = Image.new("RGBA", base.size, (0,0,0,0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    sd.ellipse((center[0]-box[0]*.34, center[1]+box[1]*.35,
                center[0]+box[0]*.34, center[1]+box[1]*.47), fill=(0,0,0,145))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    base.alpha_composite(shadow)
    base.alpha_composite(obj, (x, y))


def header(d, chapter):
    d.text((58, 47), "NUVIA ACADEMY", font=font(20), fill=PAPER)
    d.rounded_rectangle((58, 89, 302, 132), radius=9, fill=(188, 148, 80))
    d.text((80, 99), f"CAPÍTULO {chapter:02d}", font=font(18), fill=(5, 20, 38))


def pedestal(d, cx, y, width, accent):
    d.ellipse((cx-width/2, y-12, cx+width/2, y+22), fill=(4,12,26,230), outline=accent, width=2)
    d.line((cx-width*.42, y+22, cx+width*.42, y+22), fill=accent, width=3)


def save_jpeg_copy(png_path):
    jpg = png_path.with_suffix(".jpg")
    Image.open(png_path).convert("RGB").save(jpg, quality=95, subsampling=0, optimize=True)


def chapter1():
    out = ROOT / "output/videos/video-01-seguridad-estabilidad/10-youtube"
    source = out / "NUVIA-AF01-miniatura-fondo-imagegen-v1.png"
    bg = Image.open(source).convert("RGB")
    bg = bg.resize((W, H), Image.Resampling.LANCZOS).convert("RGBA")
    # Velo gradual para conservar el fondo original y asegurar contraste del nuevo título.
    veil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vp = veil.load()
    for y in range(H):
        for x in range(720):
            a = int(82 * max(0, 1 - x / 720))
            vp[x, y] = (0, 8, 20, a)
    bg.alpha_composite(veil)
    d = ImageDraw.Draw(bg, "RGBA")
    header(d, 1)
    d.text((58, 183), "EFECTIVO,", font=font(60), fill=PAPER)
    d.text((58, 252), "DEPÓSITOS", font=font(60), fill=PAPER)
    d.text((58, 321), "Y BONOS", font=font(60), fill=PAPER)
    gold_text(bg, (58, 427), "¿SON SEGUROS?", font(57))
    d = ImageDraw.Draw(bg, "RGBA")
    d.rounded_rectangle((58, 507, 515, 515), radius=4, fill=GOLD)
    d.text((58, 551), "LETRAS · PAGARÉS · RENTA FIJA", font=font(21), fill=PAPER)
    p = out / "NUVIA-AF01-caratula-youtube-nombre-directo-v2.png"
    bg.convert("RGB").save(p, quality=96)
    save_jpeg_copy(p)
    return p


def chapter2():
    out = ROOT / "output/videos/video-02-crecimiento-diversificacion/08-youtube"
    out.mkdir(parents=True, exist_ok=True)
    im = background().convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    header(d, 2)
    d.text((58, 180), "ACCIONES,", font=font(64), fill=PAPER)
    d.text((58, 252), "FONDOS", font=font(64), fill=PAPER)
    d.text((58, 324), "O ETF", font=font(64), fill=PAPER)
    gold_text(im, (58, 428), "¿QUÉ ELEGIR?", font(58))
    d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((58, 508, 515, 516), radius=4, fill=GOLD)
    d.text((58, 552), "TRES FORMAS DE INVERTIR", font=font(23), fill=PAPER)
    assets = [
        (ROOT / "output/videos/video-02-crecimiento-diversificacion/04-assets/raster/empresa-accion-3d.png", 760, (115, 185, 235, 90), "ACCIÓN"),
        (ROOT / "output/videos/video-02-crecimiento-diversificacion/04-assets/raster/fondo-diversificado-3d.png", 970, (75, 190, 155, 95), "FONDO"),
        (ROOT / "output/videos/video-02-crecimiento-diversificacion/04-assets/raster/etf-cotizado-3d.png", 1170, (228, 181, 89, 100), "ETF"),
    ]
    for path, cx, glow, label in assets:
        paste_asset(im, path, (cx, 390), (235, 290), glow)
        d = ImageDraw.Draw(im, "RGBA")
        pedestal(d, cx, 545, 170, glow[:3]+(190,))
        tw=d.textbbox((0,0), label, font=font(19))[2]
        d.rounded_rectangle((cx-tw/2-18,570,cx+tw/2+18,608),radius=19,fill=(8,30,58,235),outline=glow[:3]+(210,),width=2)
        d.text((cx,578),label,font=font(19),fill=PAPER,anchor="ma")
    p = out / "NUVIA-AF02-caratula-youtube-1280x720-v1.png"
    im.convert("RGB").save(p, quality=96)
    save_jpeg_copy(p)
    return p


def chapter3():
    out = ROOT / "output/videos/video-03-activos-complementarios/08-youtube"
    out.mkdir(parents=True, exist_ok=True)
    im = background().convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    header(d, 3)
    d.text((58, 183), "INMUEBLE", font=font(59), fill=PAPER)
    d.text((58, 250), "+ ORO", font=font(59), fill=PAPER)
    d.text((58, 317), "+ PENSIONES", font=font(59), fill=PAPER)
    d.text((58, 384), "+ CRIPTO", font=font(59), fill=PAPER)
    gold_text(im, (58, 481), "¿QUÉ APORTAN?", font(51))
    d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((58, 550, 515, 558), radius=4, fill=GOLD)
    d.text((58, 592), "CUATRO RIESGOS DIFERENTES", font=font(21), fill=PAPER)
    assets = [
        (ROOT / "output/videos/video-03-activos-complementarios/04-assets/raster/inmueble-socimi-3d.png", 770, 315, (90,145,175,95), "INMUEBLE"),
        (ROOT / "output/videos/video-03-activos-complementarios/04-assets/raster/oro-inversion-3d.png", 1045, 315, (235,180,70,105), "ORO"),
        (ROOT / "output/videos/video-03-activos-complementarios/04-assets/raster/plan-pensiones-3d.png", 780, 535, (125,90,175,100), "PENSIONES"),
        (ROOT / "output/videos/video-03-activos-complementarios/04-assets/raster/cripto-custodia-riesgo-3d.png", 1060, 535, (210,85,70,100), "CRIPTO"),
    ]
    for path,cx,cy,glow,label in assets:
        paste_asset(im,path,(cx,cy),(215,175),glow)
        d=ImageDraw.Draw(im,"RGBA")
        pedestal(d,cx,cy+90,145,glow[:3]+(190,))
        d.text((cx,cy+118),label,font=font(16),fill=PAPER,anchor="ma")
    p = out / "NUVIA-AF03-caratula-youtube-1280x720-v1.png"
    im.convert("RGB").save(p, quality=96)
    save_jpeg_copy(p)
    return p


if __name__ == "__main__":
    for path in (chapter1(), chapter2(), chapter3()):
        print(path)
