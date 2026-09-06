#!/bin/bash
#
# Pre-deployment readiness check for FormulaAtlas.
#
# Verifies:
#   1. TypeScript compiles clean
#   2. All domain tests pass
#   3. All required environment variables are documented in .env.example
#   4. Prisma schema is valid
#   5. No console.log of secrets (password, token, secret)
#   6. No TODO/FIXME left in production API routes
#   7. Next.js build succeeds (optional — slow, skipped if --skip-build)
#
# Usage:
#   bash scripts/pre-deploy-check.sh           # full check (no build)
#   bash scripts/pre-deploy-check.sh --build   # include next build
#
# Exit code: 0 = ready to deploy, 1 = issues found

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

ok()   { echo -e "${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}✗${NC} $1"; ((FAIL++)); }
warn() { echo -e "${YELLOW}⚠${NC} $1"; ((WARN++)); }

echo "============================================"
echo "  FormulaAtlas Pre-Deploy Readiness Check"
echo "============================================"
echo ""

# ---------------------------------------------------------------------------
# 1. TypeScript check
# ---------------------------------------------------------------------------
echo "1. TypeScript compilation..."
if npx tsc --noEmit 2>/dev/null; then
  ok "TypeScript compiles clean"
else
  fail "TypeScript has errors — run 'npx tsc --noEmit' for details"
fi
echo ""

# ---------------------------------------------------------------------------
# 2. Domain tests
# ---------------------------------------------------------------------------
echo "2. Domain tests..."
TEST_OUTPUT=$(npm run test:domain 2>&1)
if echo "$TEST_OUTPUT" | grep -q "All deterministic domain suites passed"; then
  ok "All domain tests pass"
else
  FAILED=$(echo "$TEST_OUTPUT" | grep -c "failed with exit code")
  if [ "$FAILED" -gt 0 ]; then
    fail "$FAILED test suite(s) failed — run 'npm run test:domain' for details"
  else
    fail "Test runner error — check output"
  fi
fi
echo ""

# ---------------------------------------------------------------------------
# 3. Environment variables documented
# ---------------------------------------------------------------------------
echo "3. Environment variables..."
REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "NEXT_PUBLIC_BASE_URL"
  "WHATSAPP_SEND_MODE"
  "CRON_SECRET"
  "ADMIN_SECRET"
  "NEXT_PUBLIC_POSTHOG_KEY"
  "CHARGILY_SECRET_KEY"
  "CHARGILY_WEBHOOK_SECRET"
)

ENV_EXAMPLE=".env.example"
if [ ! -f "$ENV_EXAMPLE" ]; then
  warn ".env.example not found — create it from .env.example template"
else
  for VAR in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$VAR=" "$ENV_EXAMPLE" || grep -q "^# $VAR" "$ENV_EXAMPLE"; then
      ok "$VAR documented"
    else
      warn "$VAR not found in .env.example"
    fi
  done
fi
echo ""

# ---------------------------------------------------------------------------
# 4. Prisma schema valid
# ---------------------------------------------------------------------------
echo "4. Prisma schema..."
if npx prisma validate 2>/dev/null; then
  ok "Prisma schema is valid"
else
  fail "Prisma schema validation failed"
fi

# Check Prisma client is generated
if [ -d "node_modules/.prisma/client" ]; then
  ok "Prisma client generated"
else
  warn "Prisma client not generated — run 'npx prisma generate'"
fi
echo ""

# ---------------------------------------------------------------------------
# 5. No secret leaks in console.log
# ---------------------------------------------------------------------------
echo "5. Secret leak check..."
SECRET_PATTERNS="console\.log\(.*password|console\.log\(.*token|console\.log\(.*secret|console\.log\(.*apiKey"
LEAKS=$(grep -rn "$SECRET_PATTERNS" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | wc -l)
if [ "$LEAKS" -eq 0 ]; then
  ok "No secret leaks in console.log"
else
  fail "Found $LEAKS potential secret leaks in console.log"
  grep -rn "$SECRET_PATTERNS" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | head -5
fi
echo ""

# ---------------------------------------------------------------------------
# 6. TODO/FIXME in production API routes
# ---------------------------------------------------------------------------
echo "6. TODO/FIXME in API routes..."
TODOS=$(grep -rn "TODO\|FIXME" src/app/api/ --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l)
if [ "$TODOS" -eq 0 ]; then
  ok "No TODO/FIXME in API routes"
else
  warn "$TODOS TODO/FIXME found in API routes (not blocking, but review)"
  grep -rn "TODO\|FIXME" src/app/api/ --include="*.ts" 2>/dev/null | head -3
fi
echo ""

# ---------------------------------------------------------------------------
# 7. Build check (optional)
# ---------------------------------------------------------------------------
if [ "$1" = "--build" ]; then
  echo "7. Next.js build..."
  if npx next build 2>&1 | tail -5; then
    ok "Next.js build succeeds"
  else
    fail "Next.js build failed"
  fi
  echo ""
else
  echo "7. Next.js build (skipped — use --build to enable)"
  echo ""
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "============================================"
echo "  SUMMARY"
echo "============================================"
echo -e "  ${GREEN}Passed:${NC}  $PASS"
echo -e "  ${RED}Failed:${NC}  $FAIL"
echo -e "  ${YELLOW}Warnings:${NC} $WARN"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ NOT READY TO DEPLOY${NC} — fix $FAIL issue(s) above"
  exit 1
else
  echo -e "${GREEN}✅ READY TO DEPLOY${NC}"
  if [ "$WARN" -gt 0 ]; then
    echo "   ($WARN warnings — review but not blocking)"
  fi
  exit 0
fi
