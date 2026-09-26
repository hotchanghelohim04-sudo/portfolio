# Portfolio - Hotchang Sappi Helohim Krool

Personal portfolio of a cybersecurity analyst and penetration tester, built as a plain static site (HTML, CSS and vanilla JavaScript, no framework, no build step).

Live site: https://hotchanghelohimportofolio2.netlify.app

## Features

- **Design**: dark-first "cyber" interface with an animated aurora background, glass cards, gradient accents and a polished light theme (the theme switch is a circular reveal, and the saved choice is applied before the first paint, so there is no flash)
- **Hero**: interactive network of nodes and data packets drawn on a canvas, holographic portrait frame, and a terminal window that types its commands
- **Fluid interactions**: scroll-reveal, animated counters, sliding active-section indicator in the navigation, timelines that fill as you scroll, cursor spotlight on cards, 3D tilt and magnetic buttons (mouse devices only)
- **Certifications**: filterable by issuer, with live counts; the numbers shown in the hero and in the stats are computed from the page itself
- **Contact**: working form using [Netlify Forms](https://docs.netlify.com/forms/setup/) (honeypot field against spam), copy-to-clipboard buttons for the e-mail and phone number
- **Accessibility**: WCAG 2.2 AA checked with axe-core and with measured contrast on the rendered backgrounds, skip link, landmarks, keyboard-friendly menu (Escape closes it, the page behind is inert while it is open), visible focus, `prefers-reduced-motion` and forced-colors support
- **Works without JavaScript**: all content, links and the form stay available; JavaScript only adds the effects
- **Performance**: no third-party request (fonts and icons are self-hosted), animations use transforms and opacity, and the canvas pauses when it is off-screen and lowers its quality on slow devices
- **SEO**: description, Open Graph / Twitter cards, schema.org `Person` data, `robots.txt`, `sitemap.xml`
- **Security**: security headers and a strict Content Security Policy (see `netlify.toml`)

## Project structure

```
index.html       the whole page (markup, meta tags, structured data, icon sprite)
style.css        design tokens (dark and light), components, responsive rules
script.js        all interactions, one small independent module per feature
theme-init.js    applies the saved theme before the first paint (loaded in <head>)
assets/          profile photo (JPEG, two sizes), social preview image, CV (PDF)
assets/fonts/    Inter and JetBrains Mono (WOFF2) with their licenses
robots.txt       crawler rules
sitemap.xml      sitemap (one URL)
netlify.toml     Netlify config: publish directory, security headers, font caching
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
- **Colours and shapes**: everything is driven by the CSS variables at the top of `style.css` (`:root` for the dark theme, `:root[data-theme='light']` for the light one).
- **Content**: text lives in `index.html`. A new certification is one `<li class="card cert-card" data-issuer="...">`; the filter buttons, their counts and the counters in the hero are generated from these cards.
- **Preview image**: `assets/og-image.jpg` (1200x630) is what LinkedIn, WhatsApp and similar apps show when the link is shared. Social networks cache it, so use their debugger tools to refresh it after a change.
- **Third-party content**: the site loads nothing from other hosts, and the Content Security Policy in `netlify.toml` only allows its own files. If you add a script, font or embed from elsewhere, add its host to the policy or the browser will block it.
- **Fonts**: Inter (variable, all weights) and JetBrains Mono (variable) are self-hosted in `assets/fonts/`; the `@font-face` rules are at the top of `style.css`. Font files are cached for a year, so give a replaced file a new name.
- **Icons**: they are inline SVG, defined once in the sprite at the top of `index.html` (`<symbol id="i-NAME">`). To use one: `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-NAME"></use></svg>`. To add a new icon, copy its SVG from [Font Awesome Free](https://fontawesome.com/search?o=r&m=free) and add a `<symbol>` with the same `viewBox` and `path`.

## Credits

Icons: [Font Awesome Free](https://fontawesome.com) 6.5.1 by Fonticons, Inc., licensed under [CC BY 4.0](https://fontawesome.com/license/free).
Fonts: [Inter](https://rsms.me/inter/) by The Inter Project Authors and [JetBrains Mono](https://www.jetbrains.com/lp/mono/) by The JetBrains Mono Project Authors, both licensed under the SIL Open Font License 1.1 ([Inter](assets/fonts/OFL-Inter.txt), [JetBrains Mono](assets/fonts/OFL-JetBrainsMono.txt)).
