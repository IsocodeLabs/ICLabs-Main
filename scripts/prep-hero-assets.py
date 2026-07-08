#!/usr/bin/env python3
"""
Hero asset prep — derives WebGL-ready textures from the source layers
(l1/l2/l3) WITHOUT altering the artwork's look:

  l1.png (sky/meadow, opaque)  -> l1-base   (plane + dotted trail inpainted out)
                               -> plane.png (the paper plane as an animatable sprite)
  l2.png (figures, alpha)      -> l2-figures (low-alpha dark export veil removed;
                                              warm glow halos preserved)
  l3.png (flora, alpha)        -> l3-flora   (same veil cleanup)
  all three                    -> hero-static.webp / hero-mobile.webp (composites
                                              of the ORIGINAL layers, for
                                              reduced-motion + mobile)

Run from repo root:  python3 scripts/prep-hero-assets.py <assets-dir> <out-dir>
"""
import sys
from pathlib import Path

from PIL import Image, ImageFilter

ASSETS = Path(sys.argv[1] if len(sys.argv) > 1 else '..')
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'public/hero')
OUT.mkdir(parents=True, exist_ok=True)

# Regions measured on the 1536x1024 source (do not change without re-measuring)
INPAINT_BOX = (825, 295, 1150, 475)   # plane + dotted swirl trail
PLANE_BOX = (1048, 300, 1145, 378)    # tight-ish box around the plane itself


def load(name):
    return Image.open(ASSETS / name).convert('RGBA')


def sky_model(region):
    """Smooth sky estimate for a region: bilinear blend of its four edges.

    The sky here is a smooth painterly gradient, so interpolating between the
    (clean) rect edges reconstructs it faithfully.
    """
    w, h = region.size
    px = region.load()
    top = [px[x, 0] for x in range(w)]
    bot = [px[x, h - 1] for x in range(w)]
    left = [px[0, y] for y in range(h)]
    right = [px[w - 1, y] for y in range(h)]
    est = Image.new('RGBA', (w, h))
    epx = est.load()
    for y in range(h):
        fy = y / (h - 1)
        for x in range(w):
            fx = x / (w - 1)
            c = []
            for i in range(3):
                horiz = left[y][i] * (1 - fx) + right[y][i] * fx
                vert = top[x][i] * (1 - fy) + bot[x][i] * fy
                # weight toward the nearer pair of edges
                wh = min(fx, 1 - fx)
                wv = min(fy, 1 - fy)
                t = wv / (wh + wv) if (wh + wv) > 0 else 0.5
                c.append(int(horiz * t + vert * (1 - t)))
            epx[x, y] = (c[0], c[1], c[2], 255)
    return est


def not_sky_mask(region, est, lo=14, hi=48):
    """Grayscale mask of pixels that differ from the sky estimate."""
    w, h = region.size
    px, epx = region.load(), est.load()
    mask = Image.new('L', (w, h), 0)
    mpx = mask.load()
    for y in range(h):
        for x in range(w):
            d = sum(abs(px[x, y][i] - epx[x, y][i]) for i in range(3))
            v = 0 if d <= lo else 255 if d >= hi else int((d - lo) / (hi - lo) * 255)
            mpx[x, y] = v
    return mask


def prep_l1(l1):
    region = l1.crop(INPAINT_BOX)
    est = sky_model(region)
    mask = not_sky_mask(region, est)

    # --- plane sprite (alpha = how much the pixel differs from sky) ---
    pb = (PLANE_BOX[0] - INPAINT_BOX[0], PLANE_BOX[1] - INPAINT_BOX[1],
          PLANE_BOX[2] - INPAINT_BOX[0], PLANE_BOX[3] - INPAINT_BOX[1])
    plane_rgb = region.crop(pb)
    plane_a = mask.crop(pb).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    plane = plane_rgb.copy()
    plane.putalpha(plane_a)
    plane.save(OUT / 'plane.png')

    # --- inpaint: replace not-sky pixels with the sky estimate (feathered) ---
    grown = mask.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2.5))
    patched = Image.composite(est, region, grown)
    base = l1.copy()
    base.paste(patched, INPAINT_BOX[:2])
    base.convert('RGB').save(OUT / 'l1-base.webp', quality=90)
    return base


def clean_veil(img, name, a_max=110, lum_max=110):
    """Remove the dark low-alpha export veil, keep bright warm halos.

    Veil pixels: low alpha AND dark RGB. Halo pixels are warm/bright — kept.
    """
    w, h = img.size
    out = img.copy()
    px = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if 0 < a < a_max:
                lum = max(r, g, b)
                if lum < lum_max:
                    px[x, y] = (r, g, b, 0)
                elif a < 40 and lum < 160:
                    px[x, y] = (r, g, b, 0)
    out.save(OUT / name, quality=92)
    return out


def composites(l1, l2, l3):
    static = l1.copy()
    static.alpha_composite(l2)
    static.alpha_composite(l3)
    static.convert('RGB').save(OUT / 'hero-static.webp', quality=88)
    # Mobile: portrait crop on the developer half (laptop glow) + flowers
    mob = static.crop((760, 130, 1420, 1024)).convert('RGB')
    mob.save(OUT / 'hero-mobile.webp', quality=88)


if __name__ == '__main__':
    l1, l2, l3 = load('l1.png'), load('l2.png'), load('l3.png')
    print('prepping l1 (plane sprite + inpaint)…')
    prep_l1(l1)
    print('cleaning l2/l3 alpha veil…')
    l2c = clean_veil(l2, 'l2-figures.webp')
    l3c = clean_veil(l3, 'l3-flora.webp')
    print('building static composites…')
    # static frames keep the baked plane (original l1) but need the cleaned
    # figure/flora layers — the veil is an export artifact, not the art
    composites(l1, l2c, l3c)
    print('done ->', OUT)
