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
    ("frontier", "/frontier.html", "Frontier Tech"),
    ("record", "/track-record.html", "Track Record"),
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
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html)
        count += 1
    print(f"Built {count} pages.")


if __name__ == "__main__":
    main()
