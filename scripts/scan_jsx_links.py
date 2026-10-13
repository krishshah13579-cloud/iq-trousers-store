import os
import re

src_dir = "src"

link_patterns = [
    re.compile(r"""<Link[^>]+href=["']([^"']+)["']"""),
    re.compile(r"""<Link[^>]+href=\{`([^`]+)`\}"""),
    re.compile(r"""<Link[^>]+href=\{["']([^"']+)["']\}"""),
    re.compile(r"""<a[^>]+href=["']([^"']+)["']"""),
    re.compile(r"""<a[^>]+href=\{`([^`]+)`\}"""),
    re.compile(r"""router\.push\(["']([^"']+)["']\)"""),
    re.compile(r"""router\.push\(`([^`]+)`\)"""),
    re.compile(r"""redirect\(["']([^"']+)["']\)"""),
    re.compile(r"""redirect\(`([^`]+)`\)"""),
]

links_by_file = {}

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith((".tsx", ".ts", ".jsx", ".js")):
            filepath = os.path.join(root, f)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
                for pat in link_patterns:
                    for match in pat.finditer(content):
                        href = match.group(1)
                        if filepath not in links_by_file:
                            links_by_file[filepath] = []
                        links_by_file[filepath].append(href)

print("=== ALL EXTRACTED LINKS BY FILE ===")
for filepath, hrefs in sorted(links_by_file.items()):
    clean_fp = filepath.replace("src/", "")
    for h in set(hrefs):
        print(f"{clean_fp} -> {h}")
