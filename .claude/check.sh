#!/bin/sh
# The one check: stop gate, commit gate and CI all run this. The writer's
# core has a test; the build proves everything else.
set -eu
cd "$(dirname "$0")/.."
npm test
npm run build
