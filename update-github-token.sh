#!/bin/bash
# Helper script to update GitHub token in keychain

echo "This will update your GitHub credentials in the macOS Keychain."
echo "You'll be prompted for your username and token."
echo ""
read -p "Enter your GitHub username: " username
read -s -p "Enter your Personal Access Token (with workflow scope): " token
echo ""

# Use git credential helper to store the token
echo "https://${username}:${token}@github.com" | git credential approve

echo ""
echo "Credentials stored! Now trying to push..."
git push

