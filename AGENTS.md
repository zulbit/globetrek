<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project Deployment & VPS Context
- **Target Server**: `tour.testbench.shop`
- **SSH User**: `ubuntu`
- **SSH Private Key Path (Local)**: `C:\Users\Zulqarnain\Downloads\ssh-key-2026-05-29.key`
- **Live VPS Web Root / Project Path**: `/var/www/tour_testben_usr89/data/www/tour.testbench.shop/app`
- **GitHub Repository**: `https://github.com/zulbit/globetrek.git`
- **CI/CD Pipeline**: GitHub Actions (`.github/workflows/deploy.yml`) triggers automatically on push to `main`, SSHing as `ubuntu` to pull and build at `/var/www/tour_testben_usr89/data/www/tour.testbench.shop/app`.

