# Portfolio - Hotchang Sappi Helohim Krool

Personal portfolio of a cybersecurity analyst and penetration tester, built as a plain static site (HTML, CSS and vanilla JavaScript, no build step).

Live site: https://hotchanghelohimportofolio2.netlify.app

## Features

- Single page: hero, about, skills, experience, education, certifications, contact
- Dark and light themes (remembered between visits)
- Working contact form using [Netlify Forms](https://docs.netlify.com/forms/setup/), with a honeypot field against spam
- Responsive layout, tested from 320 px phones to desktop
- Accessibility: skip link, landmarks, keyboard-friendly menu, WCAG A/AA checked with axe-core
- SEO: description, Open Graph / Twitter cards, schema.org `Person` data, `robots.txt`, `sitemap.xml`
- Security headers and a strict Content Security Policy (see `netlify.toml`)

## Project structure

```
index.html      the whole page (markup, meta tags, structured data)
style.css       styles and both themes
script.js       menu, theme toggle, contact form
assets/         profile photo (JPEG, two sizes), social preview image, CV (PDF)
assets/fonts/   Poppins (WOFF2, latin and latin-ext) and its license (OFL.txt)
robots.txt      crawler rules
sitemap.xml     sitemap (one URL)
netlify.toml    Netlify config: publish directory and security headers
```

## Run it locally

Any static file server works. From the project folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. Note that the contact form only works once deployed on Netlify: a local server cannot receive form submissions.

## Deploy on Netlify

1. In Netlify, link this repository to the site (**Add new site > Import an existing project**, or **Site configuration > Build & deploy > Link repository** for an existing site).
2. Leave the build command empty and the publish directory as `.` (already set in `netlify.toml`).
3. After the first deploy, check that a `contact` form appears in the **Forms** tab.
4. Add an e-mail notification for new form submissions (**Site configuration > Notifications**), so that new messages are sent to your inbox. Netlify's menu labels change from time to time: search its docs for "form submission notifications" if you cannot find it.

Every push to `main` then redeploys the site automatically.

## Customize

- **Domain**: the site URL appears in the `canonical` link, the `og:` / `twitter:` tags and the JSON-LD block of `index.html`, and in `robots.txt` and `sitemap.xml`. Update all of them if you move to a custom domain.
- **Preview image**: `assets/og-image.jpg` (1200x630) is what LinkedIn, WhatsApp and similar apps show when the link is shared. Social networks cache it, so use their debugger tools to refresh it after a change.
- **Third-party content**: the site loads nothing from other hosts, and the Content Security Policy in `netlify.toml` only allows its own files. If you add a script, font or embed from elsewhere, add its host to the policy or the browser will block it.
- **Fonts**: Poppins is self-hosted in `assets/fonts/` (weights 400, 500, 600, 700 and 800; the `@font-face` rules are at the top of `style.css`). To use another weight, add its WOFF2 files, a matching `@font-face` rule and a `<link rel="preload">` in `index.html`. Font files are cached for a year, so give a replaced file a new name.
- **Icons**: they are inline SVG, defined once in the sprite at the top of `index.html` (`<symbol id="icon-NAME">`). To use one: `<svg class="svg-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><use href="#icon-NAME"></use></svg>`. To add a new icon, copy its SVG from [Font Awesome Free](https://fontawesome.com/search?o=r&m=free) and add a `<symbol>` with the same `viewBox` and `path`. The icons in the commented-out Article and Trainings sections still use the old `<i class="fas ...">` markup and need converting if you bring those sections back.

## Credits

Icons: [Font Awesome Free](https://fontawesome.com) 6.5.1 by Fonticons, Inc., licensed under [CC BY 4.0](https://fontawesome.com/license/free). Font: [Poppins](https://fonts.google.com/specimen/Poppins) by The Poppins Project Authors, licensed under the [SIL Open Font License 1.1](assets/fonts/OFL.txt).
