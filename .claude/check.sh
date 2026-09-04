#!/bin/sh
# The one check: stop gate, commit gate and CI all run this. There is no
# lint, typecheck or test script, so the build is what proves a change.
set -eu
cd "$(dirname "$0")/.."
npm run build
