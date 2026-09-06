#!/bin/sh
# Survey the live sites a sheet links to. Run it by hand when a site has
# changed, then set that entry's `preview.surveyed` to today and commit both.
#
# Screenshots rather than iframes on purpose: one of the two sites refuses to
# be framed anywhere but its own portal, a live frame would load a third
# party's page for every visitor, and a marketing page at a third of its size
# is unreadable. Astro converts the PNGs at build time, so shoot them large.
set -eu

PW="playwright-core@1.60.0"
OUT="src/assets/previews"
SHOT="npx -y $PW screenshot --channel chrome --wait-for-timeout 2500"

# Both sites are shot at phone width, because the inset prints a quarter of a
# column wide: a desktop page reduced that far says only that a site exists,
# while the site's own narrow layout still has readable type at that size.
mkdir -p "$OUT"
$SHOT --viewport-size=520,860 https://www.juniter.de/ "$OUT/consultancy-website.png"
$SHOT --viewport-size=520,860 https://tower.cct-ev.de/ "$OUT/room-presence.png"

ls -la "$OUT"
