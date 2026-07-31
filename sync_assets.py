import os
import shutil

web_root = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/assets'
build_assets = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/app/.output/public/assets'

if os.path.exists(build_assets) and os.path.exists(web_root):
    # Purge old stale assets from web_root to prevent mismatched module export syntax errors
    for item in os.listdir(web_root):
        item_path = os.path.join(web_root, item)
        if os.path.isfile(item_path):
            try:
                os.remove(item_path)
            except Exception:
                pass

    # Copy fresh build assets
    for item in os.listdir(build_assets):
        src = os.path.join(build_assets, item)
        dst = os.path.join(web_root, item)
        if os.path.isfile(src):
            shutil.copyfile(src, dst)

print("Clean asset sync complete.")
