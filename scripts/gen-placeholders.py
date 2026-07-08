#!/usr/bin/env python3
"""
PLACEHOLDER quiz tiles + OG image — abstract brand-palette compositions so the
quiz layout works end-to-end. These are scaffolding, NOT the final art system.
Replace with the generated tile set per isocodelabs-asset-prompts.md.
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path('public/quiz')
OUT.mkdir(parents=True, exist_ok=True)

PAPER = (244, 239, 230)
INK = (26, 23, 20)
MIDNIGHT = (18, 22, 28)
COPPER = (176, 106, 59)
COPPER_LIT = (206, 148, 99)
COPPER_DEEP = (126, 74, 40)
TAUPE = (138, 127, 112)

W, H = 640, 800


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vgrad(c1, c2):
    im = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(im)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp(c1, c2, y / H))
    return im


def glow(im, cx, cy, r, color, strength=0.85):
    layer = Image.new('RGB', (W, H), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tuple(int(c * strength) for c in color))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.55))
    return Image.blend(im, Image.composite(layer, im, layer.convert('L')), 0.5) if False else \
        Image.eval(Image.blend(im, layer, 0.0), lambda v: v) if False else _screen(im, layer)


def _screen(a, b):
    from PIL import ImageChops
    return ImageChops.screen(a, b)


def save(im, name):
    im.save(OUT / name, quality=85)
    print(name)


# ---- Q3: brand-style tiles ----

# bold & striking: hard copper diagonal against midnight
im = vgrad(MIDNIGHT, (10, 12, 16))
d = ImageDraw.Draw(im)
d.polygon([(0, H), (W, 180), (W, 420), (0, H)], fill=COPPER)
d.polygon([(0, H), (W, 300), (W, 420), (0, H)], fill=COPPER_DEEP)
im = glow(im, W - 120, 140, 190, COPPER_DEEP)
save(im, 'style-bold.webp')

# warm & human: soft amber/cream field
im = vgrad((236, 220, 198), PAPER)
im = glow(im, W // 2, H // 3, 300, (196, 138, 92))
im = im.filter(ImageFilter.GaussianBlur(2))
save(im, 'style-warm.webp')

# minimal & precise: paper, one hairline, one copper dot
im = vgrad(PAPER, (238, 232, 221))
d = ImageDraw.Draw(im)
d.line([(W // 2, 140), (W // 2, H - 200)], fill=(208, 200, 186), width=2)
d.ellipse([W // 2 - 9, H - 190, W // 2 + 9, H - 172], fill=COPPER)
save(im, 'style-minimal.webp')

# editorial & rich: deep ink columns with a copper rule
im = vgrad(INK, (40, 34, 28))
d = ImageDraw.Draw(im)
for i, x in enumerate(range(70, W - 60, 90)):
    h = 300 + (i % 3) * 90
    d.rectangle([x, H - 120 - h, x + 48, H - 120], fill=lerp((58, 50, 42), (34, 29, 24), i / 6))
d.rectangle([60, 110, W - 60, 118], fill=COPPER)
im = glow(im, 90, 114, 110, COPPER_DEEP)
save(im, 'style-editorial.webp')

# ---- Q4: feeling tiles (copper-light-against-depth language) ----

# trust: steady centered light, low horizon
im = vgrad(MIDNIGHT, (24, 30, 38))
d = ImageDraw.Draw(im)
d.rectangle([0, int(H * 0.72), W, H], fill=(14, 17, 22))
im = glow(im, W // 2, int(H * 0.72), 210, COPPER)
save(im, 'feel-trust.webp')

# desire: rising warm bloom off-centre
im = vgrad((22, 20, 24), MIDNIGHT)
im = glow(im, int(W * 0.68), int(H * 0.38), 260, COPPER_LIT)
im = glow(im, int(W * 0.62), int(H * 0.44), 120, (230, 170, 110))
save(im, 'feel-desire.webp')

# calm confidence: level copper line on deep field
im = vgrad((16, 20, 26), (22, 27, 34))
d = ImageDraw.Draw(im)
d.line([(90, H // 2), (W - 90, H // 2)], fill=COPPER, width=4)
im = glow(im, W // 2, H // 2, 170, COPPER_DEEP, 0.7)
save(im, 'feel-calm.webp')

# delight: scattered small lights
im = vgrad(MIDNIGHT, (20, 24, 31))
for i, (fx, fy, r) in enumerate([(0.3, 0.3, 70), (0.68, 0.22, 45), (0.55, 0.55, 95),
                                 (0.22, 0.68, 50), (0.78, 0.72, 65), (0.45, 0.82, 38)]):
    im = glow(im, int(W * fx), int(H * fy), r, COPPER_LIT if i % 2 else COPPER, 0.8)
save(im, 'feel-delight.webp')

# ---- OG image (1200×630) — placeholder ----
og = Image.new('RGB', (1200, 630))
d = ImageDraw.Draw(og)
for y in range(630):
    d.line([(0, y), (1200, y)], fill=lerp(MIDNIGHT, (24, 29, 37), y / 630))
og = _screen(og, _og_glow := Image.new('RGB', (1200, 630), (0, 0, 0)))
gl = Image.new('RGB', (1200, 630), (0, 0, 0))
dg = ImageDraw.Draw(gl)
dg.ellipse([760, 60, 1240, 540], fill=(88, 53, 30))
gl = gl.filter(ImageFilter.GaussianBlur(150))
og = _screen(og, gl)
from PIL import ImageFont
try:
    font_big = ImageFont.truetype('/System/Library/Fonts/Supplemental/Georgia.ttf', 72)
    font_small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Georgia.ttf', 30)
except OSError:
    font_big = font_small = None
d = ImageDraw.Draw(og)
d.text((90, 240), 'ISOCODELABS', fill=PAPER, font=font_big)
d.text((92, 340), 'Software, made properly.', fill=COPPER_LIT, font=font_small)
og.save('public/og.png')
print('og.png')
