import os
import glob
import shutil

web_root = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/assets'
build_assets = '/var/www/tour_testben_usr89/data/www/tour.testbench.shop/app/.output/public/assets'

if os.path.exists(build_assets) and os.path.exists(web_root):
    # Copy all fresh files from build_assets into web_root
    for item in os.listdir(build_assets):
        src = os.path.join(build_assets, item)
        dst = os.path.join(web_root, item)
        if os.path.isfile(src):
            shutil.copyfile(src, dst)
            prefix = item.rsplit('-', 1)[0] if '-' in item else item
            ext = os.path.splitext(item)[1]
            if prefix and ext in ['.js', '.css']:
                # Overwrite all older hash variants in web_root with the fresh build file for this prefix
                for existing in glob.glob(os.path.join(web_root, f"{prefix}-*{ext}")):
                    shutil.copyfile(src, existing)

print("Full asset cache overwrite complete.")
