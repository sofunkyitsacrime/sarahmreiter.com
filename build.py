#!/usr/bin/env python3
"""Build sarahmreiter.com: wraps each page in src/pages with src/layout.html.

Each page file starts with a metadata block:
    <!--meta
    title: Page title
    description: One sentence for search results.
    nav: services
    -->
src/pages/index.html  -> index.html
src/pages/insights/x.html -> insights/x.html
Run:  python3 build.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).parent
SRC = ROOT / "src"
PREVIEW = True  # shows the "preview" banner; set False at launch

NAV = [
    ("services", "/services.html", "Advisory"),
    ("frontier", "/frontier.html", "Frontier tech"),
    ("record", "/track-record.html", "Track record"),
    ("insights", "/insights.html", "Insights"),
    ("speaking", "/speaking.html", "Speaking"),
    ("about", "/about.html", "About"),
]

BANNER = ('<div class="preview-banner">Preview: content is a draft pending '
          'review. Items marked [CV] or [SARAH] are placeholders.</div>')


def parse(text):
    m = re.match(r"\s*<!--meta\n(.*?)-->\n", text, re.S)
    meta = {}
    if m:
        for line in m.group(1).strip().splitlines():
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
        text = text[m.end():]
    return meta, text


def nav_html(active):
    items = []
    for key, href, label in NAV:
        cur = ' aria-current="page"' if key == active else ""
        items.append(f'<li><a href="{href}"{cur}>{label}</a></li>')
    return "\n".join(items)


def main():
    layout = (SRC / "layout.html").read_text()
    jsonld = (SRC / "jsonld.json").read_text()
    jsonld_tag = '<script type="application/ld+json">\n' + jsonld + '\n</script>\n</head>'
    count = 0
    for page in sorted((SRC / "pages").rglob("*.html")):
        meta, body = parse(page.read_text())
        rel = page.relative_to(SRC / "pages")
        path = "/" + str(rel).replace("index.html", "")
        html = (layout
                .replace("{{title}}", meta.get("title", "Sarah M. Reiter"))
                .replace("{{description}}", meta.get("description", ""))
                .replace("{{canonical}}", "https://sarahmreiter.com" + path)
                .replace("{{nav}}", nav_html(meta.get("nav", "")))
                .replace("{{banner}}", BANNER if PREVIEW else "")
                .replace("{{content}}", body))
        # Relative links, so the site works at any address
        # (sarahmreiter.com or the GitHub preview under /sarahmreiter.com/)
        # The 404 page is served at any missing path, so it keeps root-absolute links.
        is_article = rel.parts[0] == "insights" and len(rel.parts) > 1
        if is_article:
            html = html.replace('<meta property="og:type" content="website">',
                                '<meta property="og:type" content="article">', 1)
        if rel.name == "404.html":
            # Served at any missing path: no canonical, root-absolute links kept.
            html = re.sub(r'<link rel="canonical"[^>]*>\n?', '', html)
            html = re.sub(r'<meta property="og:url"[^>]*>\n?', '', html)
        else:
            html = html.replace("</head>", jsonld_tag, 1)
            # Home links go to the directory ("./" or "../"), matching the canonical "/".
            prefix = "../" * (len(rel.parts) - 1)
            html = re.sub(r'(href|src)="/"', rf'\1="{prefix or "./"}"', html)
            html = re.sub(r'(href|src)="/(?!/)', rf'\1="{prefix}', html)
        if PREVIEW or rel.name == "404.html":
            html = html.replace("<head>", '<head>\n<meta name="robots" content="noindex">', 1)
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html)
        count += 1
    print(f"Built {count} pages.")


if __name__ == "__main__":
    main()
