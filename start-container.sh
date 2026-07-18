#!/bin/bash
set -e

echo "Diagnostic mode: skipping migrations, storage:link and optimize"

docker-php-entrypoint --config /Caddyfile --adapter caddyfile 2>&1
