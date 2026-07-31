import os
import glob
import shutil
import re

web_root = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/assets'
build_assets = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/app/.output/public/assets'
server_dir = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/app/.output/server'

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

print("Found asset references in server code:", asset_refs)

for ref in asset_refs:
    target_path = os.path.join(web_root, ref)
    if not os.path.exists(target_path):
        if ref.startswith('index-') and ref.endswith('.js') and primary_js:
            shutil.copyfile(primary_js, target_path)
            print(f"Copied {primary_js} -> {target_path}")
        elif ref.startswith('styles-') and ref.endswith('.css') and primary_css:
            shutil.copyfile(primary_css, target_path)
            print(f"Copied {primary_css} -> {target_path}")

print("Asset sync complete.")
