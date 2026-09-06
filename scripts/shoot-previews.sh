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

# Each site gets the viewport its layout fills. The status page is one card:
# at desktop width the shot is mostly empty background.
mkdir -p "$OUT"
$SHOT --viewport-size=1440,900 https://www.juniter.de/ "$OUT/consultancy-website.png"
$SHOT --viewport-size=820,680 https://tower.cct-ev.de/ "$OUT/room-presence.png"

ls -la "$OUT"
