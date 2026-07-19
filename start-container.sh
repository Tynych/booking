#!/bin/bash
set -e

if [ "$RAILPACK_SKIP_MIGRATIONS" != "true" ]; then
    echo "Clearing cached config so runtime environment variables are used ..."
    php artisan config:clear

    echo "Running migrations and seeding database ..."
    php artisan migrate --force
fi

php artisan storage:link
php artisan optimize:clear
php artisan optimize

echo "Starting Laravel server ..."
docker-php-entrypoint --config /Caddyfile --adapter caddyfile 2>&1
