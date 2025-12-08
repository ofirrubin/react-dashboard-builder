#!/bin/bash

echo "🧪 Testing rud-dashboard setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📦 Step 1: Building the package..."
bun run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo "📦 Step 2: Creating tarball..."
bun pm pack
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tarball created${NC}"
else
    echo -e "${RED}✗ Tarball creation failed${NC}"
    exit 1
fi

echo ""
echo "🧪 Step 3: Testing Example (Preact)..."
cd example
echo "   Installing dependencies..."
bun install > /dev/null 2>&1
echo "   Installing local package..."
bun add ../rud-dashboard-0.1.0.tgz > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Example setup complete${NC}"
    echo -e "${YELLOW}   Run: cd example && bun run dev${NC}"
else
    echo -e "${RED}✗ Example setup failed${NC}"
fi
cd ..

echo ""
echo "✅ All tests complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Test React playground:  bun run dev"
echo "   2. Test Preact playground: bun run test:preact"
echo "   3. Test Example:           cd example && bun run dev"

