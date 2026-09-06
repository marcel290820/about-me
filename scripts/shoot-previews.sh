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

# The viewport is the composition: the inset prints what the shot holds and
# crops nothing, so each site is framed here rather than in CSS. The site is
# shot wide, because its hero is a headline on the left and a glyph on the
# right and both belong in the frame; the status page is one card, and only
# its own narrow layout is legible a quarter of a column wide.
mkdir -p "$OUT"
$SHOT --viewport-size=1280,680 https://www.juniter.de/ "$OUT/consultancy-website.png"
$SHOT --viewport-size=520,430 https://tower.cct-ev.de/ "$OUT/room-presence.png"

ls -la "$OUT"
