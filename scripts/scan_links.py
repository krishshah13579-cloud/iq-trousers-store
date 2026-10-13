import os
import re

src_dir = "src"

# Routes that exist in Next.js app directory
# Notice route groups like (auth) are stripped in URL paths
def get_valid_routes():
    app_dir = "src/app"
    valid = set()
    for root, dirs, files in os.walk(app_dir):
        rel = os.path.relpath(root, app_dir)
        has_page = any(f.startswith("page.") or f.startswith("route.") for f in files)
        if has_page:
            parts = rel.split(os.sep)
            clean_parts = [p for p in parts if not (p.startswith("(") and p.endswith(")"))]
            clean_path = "/" + "/".join(clean_parts) if clean_parts and clean_parts != ["."] else "/"
            valid.add(clean_path)
    return valid

valid_routes = get_valid_routes()
print(f"Discovered {len(valid_routes)} valid app routes:")
for r in sorted(valid_routes):
    print("  ", r)

link_re = re.compile(r"""(?:href|push|redirect|replace)\s*[:=\(]\s*[`'"](/[^`'"#?$\s]+)""")
fetch_re = re.compile(r"""fetch\s*\(\s*[`'"](/[^`'"#?$\s]+)""")

broken_links = []
all_links = set()

def matches_route(path, valid_set):
    if path in valid_set:
        return True
    # Test dynamic routes e.g. /products/[id], /orders/[id]
    parts = path.strip("/").split("/")
    for vr in valid_set:
        v_parts = vr.strip("/").split("/")
        if len(parts) == len(v_parts):
            match = True
            for p, vp in zip(parts, v_parts):
                if vp.startswith("[") and vp.endswith("]"):
                    continue
                if p != vp:
                    match = False
                    break
            if match:
                return True
        # Catch-all routes like [...nextauth]
        if any(vp.startswith("[...") for vp in v_parts):
            base_parts = [vp for vp in v_parts if not vp.startswith("[...")]
            if parts[:len(base_parts)] == base_parts:
                return True
    return False

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith((".tsx", ".ts", ".jsx", ".js")):
            filepath = os.path.join(root, f)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
                for match in link_re.finditer(content):
                    target = match.group(1)
                    all_links.add((target, filepath))
                    if not matches_route(target, valid_routes):
                        # exclude images / static assets
                        if not target.startswith(("/placeholder", "/images", "/favicon", "/manifest")):
                            broken_links.append((target, filepath, "link"))
                for match in fetch_re.finditer(content):
                    target = match.group(1)
                    if not matches_route(target, valid_routes):
                        broken_links.append((target, filepath, "fetch"))

print("\n=== POTENTIALLY BROKEN LINKS OR FETCHES ===")
if not broken_links:
    print("No broken links found!")
else:
    for target, filepath, kind in sorted(broken_links):
        print(f"[{kind.upper()}] {target} in {filepath}")
