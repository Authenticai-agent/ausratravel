#!/bin/bash
# Helper script to link Railway project

echo "Linking Railway project..."
echo ""
echo "You'll be prompted to select your Railway project."
echo "If you know your Project ID, you can also run:"
echo "  railway link <PROJECT_ID>"
echo ""
cd "$(dirname "$0")"
railway link

