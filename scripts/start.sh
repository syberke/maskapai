#!/bin/sh

# Exit on error
set -e

echo "========================================"
echo "  Flight Booking Bazma - Startup Script"
echo "========================================"
echo ""

# Run database migrations
echo "[1/3] Running Prisma migrations..."
npx prisma migrate deploy
echo "✓ Migrations complete"

# Run seed
echo "[2/3] Running database seed..."
npx prisma db seed || echo "⚠ Seed skipped (data may already exist)"
echo "✓ Seed complete"

# Start the Next.js application
echo "[3/3] Starting Next.js application..."
echo ""
exec node server.js