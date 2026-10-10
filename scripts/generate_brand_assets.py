#!/usr/bin/env python3
"""Script para procesar la identidad visual oficial de CrediRisk y generar
todos los recursos de producción (PNG con transparencia real, variantes de color,
iconos multi-tamaño, favicons y archivos SVG).
"""
import base64
import os
import shutil
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FRONTEND_PUBLIC = ROOT / "frontend" / "public"
FRONTEND_BRAND = FRONTEND_PUBLIC / "brand"
FRONTEND_ASSETS_BRAND = ROOT / "frontend" / "src" / "assets" / "brand"

# Imagen original de referencia principal seleccionada por el usuario
SOURCE_CANDIDATES = [
    Path("/Users/suntz/Downloads/Gemini_Generated_Image_yfiuk5yfiuk5yfiu.jpeg"),
    Path("/Users/suntz/.gemini/antigravity/brain/e36f2d6e-1258-4fb2-a446-7a568418f166/.user_uploaded/media_1791665851530_1e270f3a.jpg"),
]

def find_source_image() -> Path:
    for p in SOURCE_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("No se encontró la imagen original de referencia del logo.")

def create_master_logo(src_path: Path) -> Image.Image:
    im = Image.open(src_path)
    arr = np.array(im, dtype=float)
    
    # Dimensiones y centro
    h, w = arr.shape[:2]
    cx, cy = w // 2, h // 2
    
    # Encontrar bbox del símbolo
    # El fondo es azul marino oscuro (~ [14.7, 21.5, 38.6])
    bg = np.array([14.7, 21.5, 38.6])
    dist = np.linalg.norm(arr - bg, axis=2)
    
    # Bounding box con umbral de 25
    mask = dist > 25.0
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]
    
    sym_w = xmax - xmin
    sym_h = ymax - ymin
    sym_cx = (xmin + xmax) // 2
    sym_cy = (ymin + ymax) // 2
    
    # Recorte cuadrado centrado
    half = max(sym_w, sym_h) // 2 + 70 # margen proporcional
    crop = arr[sym_cy - half : sym_cy + half, sym_cx - half : sym_cx + half]
    
    # Cálculo de alpha con umbrales calibrados para eliminar bordes y halos
    crop_dist = np.linalg.norm(crop - bg, axis=2)
    low_t = 30.0
    high_t = 110.0
    t = np.clip((crop_dist - low_t) / (high_t - low_t), 0.0, 1.0)
    alpha = t * t * (3.0 - 2.0 * t) # smoothstep
    
    # Desmezclado cromático (color deconvolution) para restaurar el color del trazo en los bordes
    fg = crop.copy()
    edge_mask = (alpha > 0.001) & (alpha < 0.999)
    for c in range(3):
        fg[:, :, c][edge_mask] = np.clip(
            (crop[:, :, c][edge_mask] - (1.0 - alpha[edge_mask]) * bg[c]) / alpha[edge_mask],
            0.0, 255.0
        )
    
    # Construcción RGBA del recorte
    ch, cw = crop.shape[:2]
    rgba_crop = np.zeros((ch, cw, 4), dtype=np.uint8)
    rgba_crop[:, :, :3] = np.round(fg).astype(np.uint8)
    rgba_crop[:, :, 3] = np.round(alpha * 255.0).astype(np.uint8)
    
    crop_im = Image.fromarray(rgba_crop, "RGBA")
    
    # Redimensionar al canvas maestro 1024x1024 preservando aspect ratio centrado
    master = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    # Redimensionar el símbolo para que ocupe ~820px de alto en 1024px (espaciado óptico ~10%)
    target_size = 860
    resized_crop = crop_im.resize((target_size, target_size), Image.Resampling.LANCZOS)
    pos = ((1024 - target_size) // 2, (1024 - target_size) // 2)
    master.paste(resized_crop, pos, resized_crop)
    
    return master

def create_variants(master: Image.Image) -> dict:
    arr = np.array(master, dtype=float)
    alpha = arr[:, :, 3] / 255.0
    rgb = arr[:, :, :3]
    
    variants = {}
    
    # 1. Master Original / Color (Azul eléctrico #2563EB + Cian #38BDF8)
    variants["default"] = master
    
    # 2. Versión para fondos claros (credirisk-logo-light)
    # Aumentar contraste de los nodos y trazos cian para máxima legibilidad sobre blanco puro
    light_rgb = rgb.copy()
    # Identificar píxeles con alto componente cian/azul claro
    is_cyan = (rgb[:, :, 1] > 120) & (rgb[:, :, 2] > 180) & (rgb[:, :, 0] < 120)
    # En fondos claros, enriquecer el cian para que tenga contraste WCAG AAA
    light_rgb[is_cyan, 0] = np.clip(light_rgb[is_cyan, 0] * 0.7, 0, 255)
    light_rgb[is_cyan, 1] = np.clip(light_rgb[is_cyan, 1] * 0.85, 0, 255)
    light_rgb[is_cyan, 2] = np.clip(light_rgb[is_cyan, 2] * 0.95, 0, 255)
    
    light_arr = np.zeros_like(arr, dtype=np.uint8)
    light_arr[:, :, :3] = np.round(light_rgb).astype(np.uint8)
    light_arr[:, :, 3] = np.round(alpha * 255.0).astype(np.uint8)
    variants["light"] = Image.fromarray(light_arr, "RGBA")
    
    # 3. Versión para fondos oscuros (credirisk-logo-dark)
    # Colores luminosos y vibrantes originales con saturación intacta
    dark_rgb = rgb.copy()
    # Leve realce de brillo en modo oscuro
    dark_rgb[:, :, :3] = np.clip(dark_rgb[:, :, :3] * 1.05, 0, 255)
    dark_arr = np.zeros_like(arr, dtype=np.uint8)
    dark_arr[:, :, :3] = np.round(dark_rgb).astype(np.uint8)
    dark_arr[:, :, 3] = np.round(alpha * 255.0).astype(np.uint8)
    variants["dark"] = Image.fromarray(dark_arr, "RGBA")
    
    # 4. Versión monocromática (#0F172A slate oscuro para impresión o fondos claros neutros)
    # Preservar el gradiente de intensidad como luminosidad
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    # Invertir luminancia para que zonas más brillantes tengan trazo oscuro definido
    mono_val = 15.0 + (255.0 - lum) * 0.15 # entre #0F172A y #334155
    mono_arr = np.zeros_like(arr, dtype=np.uint8)
    mono_arr[:, :, 0] = np.round(mono_val).astype(np.uint8)
    mono_arr[:, :, 1] = np.round(mono_val * 1.2).astype(np.uint8)
    mono_arr[:, :, 2] = np.round(mono_val * 1.6).astype(np.uint8)
    mono_arr[:, :, 3] = np.round(alpha * 255.0).astype(np.uint8)
    variants["mono"] = Image.fromarray(mono_arr, "RGBA")
    
    # 5. Versión negativo / blanco puro (para fondos oscuros unicolor)
    white_arr = np.zeros_like(arr, dtype=np.uint8)
    white_arr[:, :, :3] = 255
    white_arr[:, :, 3] = np.round(alpha * 255.0).astype(np.uint8)
    variants["white"] = Image.fromarray(white_arr, "RGBA")
    
    return variants

def create_app_icon_squircle(logo_im: Image.Image, size: int = 512, bg_color = (11, 18, 32)) -> Image.Image:
    """Crea un icono de aplicación con contenedor squircle redondeado según la lámina de identidad."""
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)
    radius = int(size * 0.22) # radio suave moderno
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=bg_color)
    
    # Pegar logo centrado ocupando ~72% del contenedor
    logo_sz = int(size * 0.72)
    logo_resized = logo_im.resize((logo_sz, logo_sz), Image.Resampling.LANCZOS)
    offset = (size - logo_sz) // 2
    icon.paste(logo_resized, (offset, offset), logo_resized)
    return icon

def generate_svg_wrapper(png_path: Path, output_path: Path, title: str):
    """Genera un archivo SVG limpio que envuelve el activo de alta resolución con viewBox y metadatos."""
    with open(png_path, "rb") as f:
        b64_data = base64.b64encode(f.read()).decode("utf-8")
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <title>{title}</title>
  <desc>CrediRisk Official Visual Identity Symbol</desc>
  <image href="data:image/png;base64,{b64_data}" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>'''
    output_path.write_text(svg_content, encoding="utf-8")

def main():
    src_path = find_source_image()
    print(f"✓ Fuente identificada: {src_path}")
    
    FRONTEND_BRAND.mkdir(parents=True, exist_ok=True)
    FRONTEND_ASSETS_BRAND.mkdir(parents=True, exist_ok=True)
    
    print("✓ Generando master logo y desmezclado de bordes...")
    master = create_master_logo(src_path)
    
    variants = create_variants(master)
    
    # 1. Guardar logos principales en public/brand/
    files_map = {
        "credirisk-logo.png": variants["default"],
        "credirisk-logo-light.png": variants["light"],
        "credirisk-logo-dark.png": variants["dark"],
        "credirisk-logo-mono.png": variants["mono"],
        "credirisk-logo-white.png": variants["white"],
    }
    
    for filename, img in files_map.items():
        out_p = FRONTEND_BRAND / filename
        img.save(out_p, "PNG", optimize=True)
        # También replicar en src/assets/brand para imports estáticos de Vite
        img.save(FRONTEND_ASSETS_BRAND / filename, "PNG", optimize=True)
        print(f"  → Creado: {out_p.relative_to(ROOT)}")
    
    # 2. Generar SVGs limpios en public/brand/ y src/assets/brand/
    svg_titles = {
        "credirisk-logo.svg": ("credirisk-logo.png", "CrediRisk Logo Oficial"),
        "credirisk-logo-light.svg": ("credirisk-logo-light.png", "CrediRisk Logo Fondos Claros"),
        "credirisk-logo-dark.svg": ("credirisk-logo-dark.png", "CrediRisk Logo Fondos Oscuros"),
        "credirisk-logo-mono.svg": ("credirisk-logo-mono.png", "CrediRisk Logo Monocromático"),
        "credirisk-logo-white.svg": ("credirisk-logo-white.png", "CrediRisk Logo Negativo"),
    }
    for svg_file, (png_ref, title) in svg_titles.items():
        png_p = FRONTEND_BRAND / png_ref
        svg_p = FRONTEND_BRAND / svg_file
        generate_svg_wrapper(png_p, svg_p, title)
        # Replicar en src/assets/brand
        generate_svg_wrapper(png_p, FRONTEND_ASSETS_BRAND / svg_file, title)
        print(f"  → Creado SVG: {svg_p.relative_to(ROOT)}")
    
    # 3. Generar iconos en múltiples tamaños (512, 192, 128, 64, 48, 32, 16)
    icon_sizes = [512, 192, 128, 64, 48, 32, 16]
    ico_images = []
    
    for sz in icon_sizes:
        icon_img = master.resize((sz, sz), Image.Resampling.LANCZOS)
        # Para tamaños pequeños (<= 32px), aplicar leve realce de contraste para garantizar nitidez
        if sz <= 32:
            icon_img = ImageEnhance.Contrast(icon_img).enhance(1.15)
        
        # Guardar en public/brand/
        icon_path = FRONTEND_BRAND / f"credirisk-icon-{sz}.png"
        icon_img.save(icon_path, "PNG", optimize=True)
        
        # Guardar en public/ si corresponde
        if sz == 32:
            icon_img.save(FRONTEND_PUBLIC / "favicon-32x32.png", "PNG", optimize=True)
        elif sz == 16:
            icon_img.save(FRONTEND_PUBLIC / "favicon-16x16.png", "PNG", optimize=True)
        elif sz in (192, 512):
            icon_img.save(FRONTEND_PUBLIC / f"icon-{sz}x{sz}.png", "PNG", optimize=True)
            
        if sz in [16, 32, 48]:
            ico_images.append(icon_img)
            
        print(f"  → Icono {sz}x{sz}: {icon_path.relative_to(ROOT)}")
        
    # 4. Generar favicon.ico multi-resolución (16, 32, 48)
    favicon_ico_path = FRONTEND_PUBLIC / "favicon.ico"
    ico_images[0].save(
        favicon_ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=ico_images[1:],
    )
    print(f"  → Favicon ICO generado: {favicon_ico_path.relative_to(ROOT)}")
    
    # 5. Generar favicon.svg para navegadores modernos
    favicon_svg_path = FRONTEND_PUBLIC / "favicon.svg"
    generate_svg_wrapper(FRONTEND_PUBLIC / "favicon-32x32.png", favicon_svg_path, "CrediRisk Favicon")
    print(f"  → Favicon SVG generado: {favicon_svg_path.relative_to(ROOT)}")
    
    # 6. Generar iconos de aplicación móvil con contenedor squircle (#0B1220)
    apple_touch_path = FRONTEND_PUBLIC / "apple-touch-icon.png"
    squircle_180 = create_app_icon_squircle(master, size=180, bg_color=(11, 18, 32))
    squircle_180.save(apple_touch_path, "PNG", optimize=True)
    print(f"  → Apple Touch Icon (180x180): {apple_touch_path.relative_to(ROOT)}")
    
    pwa_512_path = FRONTEND_PUBLIC / "pwa-icon-512.png"
    squircle_512 = create_app_icon_squircle(master, size=512, bg_color=(11, 18, 32))
    squircle_512.save(pwa_512_path, "PNG", optimize=True)
    print(f"  → PWA Icon Squircle (512x512): {pwa_512_path.relative_to(ROOT)}")
    
    # 7. Generar Web App Manifest
    manifest_path = FRONTEND_PUBLIC / "site.webmanifest"
    manifest_content = '''{
  "name": "CrediRisk — Deep Learning Credit Risk",
  "short_name": "CrediRisk",
  "description": "Sistema de Evaluación de Riesgo Crediticio con Redes Neuronales Profundas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B1220",
  "theme_color": "#0B1220",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/pwa-icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
'''
    manifest_path.write_text(manifest_content, encoding="utf-8")
    print(f"  → Web Manifest: {manifest_path.relative_to(ROOT)}")
    
    print("\n✅ Todos los recursos de la identidad visual oficial fueron generados con éxito.")

if __name__ == "__main__":
    main()
