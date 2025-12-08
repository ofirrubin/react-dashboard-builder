#!/bin/bash

echo "=== Checking Preact Playground ==="
echo ""
echo "1. Checking if server is running on port 3001..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3001/index-preact.html

echo ""
echo "2. Fetching HTML content..."
curl -s http://localhost:3001/index-preact.html | head -20

echo ""
echo "3. Checking if files exist..."
echo "   index-preact.html: $([ -f index-preact.html ] && echo '✓ exists' || echo '✗ missing')"
echo "   playground/preact/main.tsx: $([ -f playground/preact/main.tsx ] && echo '✓ exists' || echo '✗ missing')"
echo "   playground/preact/App.tsx: $([ -f playground/preact/App.tsx ] && echo '✓ exists' || echo '✗ missing')"
echo "   src/index.preact.ts: $([ -f src/index.preact.ts ] && echo '✓ exists' || echo '✗ missing')"

echo ""
echo "4. Checking Vite server logs..."
echo "   Look for errors in the terminal running 'npm run test:preact'"
echo ""
echo "5. Next steps:"
echo "   - Open http://localhost:3001/ in your browser"
echo "   - Open DevTools (F12)"
echo "   - Check the Console tab for JavaScript errors"
echo "   - Check the Network tab to see which files failed to load"

