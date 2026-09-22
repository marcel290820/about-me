#!/bin/sh
# The local hooks and CI run the same production build and output checks.
set -eu
cd "$(dirname "$0")/.."
npm run check
