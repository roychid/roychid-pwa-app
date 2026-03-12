#!/usr/bin/env python3
"""
Run this script to generate all PWA icon sizes.
Usage: python3 generate-icons.py
Place your logo image as 'logo.png' in the same folder first.
"""
from PIL import Image, ImageDraw
import os

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
BG    = (8, 8, 9)      # #080809
ACC   = (110, 87, 255) # #6e57ff

os.makedirs('icons', exist_ok=True)

# Try to use provided logo, else generate a placeholder
try:
    logo = Image.open('logo.png').convert('RGBA')
    has_logo = True
except:
    has_logo = False

for size in SIZES:
    img = Image.new('RGB', (size, size), BG)
    draw = ImageDraw.Draw(img)

    if has_logo:
        thumb = size - size // 4
        logo_copy = logo.copy()
        logo_copy.thumbnail((thumb, thumb), Image.LANCZOS)
        x = (size - logo_copy.width)  // 2
        y = (size - logo_copy.height) // 2
        img.paste(logo_copy, (x, y), logo_copy)
    else:
        # Draw a simple "R" placeholder
        margin = size // 6
        draw.ellipse([margin, margin, size-margin, size-margin],
                     fill=ACC, outline=None)
        # Just a colored circle as placeholder

    img.save(f'icons/icon-{size}.png')
    print(f'Generated icons/icon-{size}.png')

print('Done! All icons generated.')
