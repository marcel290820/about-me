#!/bin/sh
# The one check: stop gate, commit gate and CI all run this. There is no
# lint or typecheck; the sheet geometry check and the build prove a change.
set -eu
cd "$(dirname "$0")/.."
npm test
npm run build
