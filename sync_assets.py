import os
import glob
import shutil
import re

web_root = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/assets'
build_assets = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/app/.output/public/assets'
server_dir = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/app/.output/server'

os.makedirs(web_root, exist_ok=True)

# 1. Copy ALL compiled build output files into Nginx assets root
for item in os.listdir(build_assets):
    src = os.path.join(build_assets, item)
    dst = os.path.join(web_root, item)
    if os.path.isfile(src):
        shutil.copyfile(src, dst)

# Find primary compiled JS & CSS files in build output
js_files = glob.glob(os.path.join(build_assets, 'index-*.js'))
css_files = glob.glob(os.path.join(build_assets, 'styles-*.css'))

primary_js = js_files[0] if js_files else None
primary_css = css_files[0] if css_files else None

# Search all files in server_dir for any /assets/xxx references
asset_refs = set()
for root, _, files in os.walk(server_dir):
    for f in files:
        if f.endswith('.mjs') or f.endswith('.js'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                matches = re.findall(r'/assets/([A-Za-z0-9_.-]+)', content)
                for m in matches:
                    asset_refs.add(m)

print(f"Found {len(asset_refs)} asset references in server code.")

for ref in asset_refs:
    target_path = os.path.join(web_root, ref)
    if not os.path.exists(target_path):
        # Extract prefix before the last hyphen hash
        prefix = ref.rsplit('-', 1)[0] if '-' in ref else ref
        ext = os.path.splitext(ref)[1]
        
        # Look for matching prefix file in build_assets
        matching = glob.glob(os.path.join(build_assets, f"{prefix}-*{ext}"))
        source = matching[0] if matching else (primary_css if ext == '.css' else primary_js)
        
        if source and os.path.exists(source):
            shutil.copyfile(source, target_path)
            print(f"Mapped {ref} -> {os.path.basename(source)}")

print("Asset sync complete.")
