#!/bin/bash

# PostgreSQL Database Setup Script for HRMS Lite (Node.js)
# Mirrors the Python FastAPI original

echo "🚀 Setting up PostgreSQL database for HRMS Lite (Node.js)..."

DB_NAME="${DB_NAME:-hrms_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "📋 Database Configuration:"
echo "  Database Name : $DB_NAME"
echo "  User          : $DB_USER"
echo "  Host          : $DB_HOST"
echo "  Port          : $DB_PORT"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U postgres >/dev/null 2>&1; then
  echo "❌ PostgreSQL is not running. Please start it first."
  echo "   macOS:  brew services start postgresql"
  echo "   Ubuntu: sudo systemctl start postgresql"
  exit 1
fi

echo "✅ PostgreSQL is running"

# Create database
echo "📦 Creating database '$DB_NAME'..."
createdb -h "$DB_HOST" -p "$DB_PORT" -U postgres "$DB_NAME" 2>/dev/null \
  || echo "   Database '$DB_NAME' already exists"

# Grant permissions
echo "👤 Granting permissions to '$DB_USER'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -d "$DB_NAME" -c "
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
" 2>/dev/null

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🔗 Connection:"
echo "   postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "📝 Create a .env file from .env.example and update:"
echo "   DB_HOST=$DB_HOST"
echo "   DB_PORT=$DB_PORT"
echo "   DB_NAME=$DB_NAME"
echo "   DB_USER=$DB_USER"
echo "   DB_PASSWORD=$DB_PASSWORD"
echo ""
echo "🎯 Next steps:"
echo "   1. cp .env.example .env && nano .env"
echo "   2. npm install"
echo "   3. npm run dev"
echo "      Tables are created automatically on first run."