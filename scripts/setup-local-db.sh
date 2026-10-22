#!/usr/bin/env bash
# Agoraya — local DB setup via PostgreSQL CLI
# Prerequisites: psql, createdb (postgresql-client / postgresql@16)
# Usage: bash scripts/setup-local-db.sh
set -euo pipefail

DB_NAME="agoraya_local"
DB_USER="agoraya"
DB_PASS="localdev"

echo "→ Creating role '$DB_USER'..."
psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" \
  | grep -q 1 || psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

echo "→ Creating database '$DB_NAME'..."
psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" \
  | grep -q 1 || createdb -U postgres -O "$DB_USER" "$DB_NAME"

echo "→ Granting privileges..."
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo ""
echo "✓ Local database ready."
echo "  Connection: postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo "  Next: cp .env.example .env.local  →  edit AUTH_SECRET  →  pnpm db:migrate:local"
