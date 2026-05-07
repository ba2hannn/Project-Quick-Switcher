#!/usr/bin/env bash
set -euo pipefail

UUID="project-quick-switcher@ba2hann.github.com"
EXTENSIONS_DIR="$HOME/.local/share/gnome-shell/extensions"
TARGET_DIR="$EXTENSIONS_DIR/$UUID"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Project Quick Switcher — Installer"
echo "==================================="
echo ""
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"
echo ""

if [ ! -f "$SOURCE_DIR/metadata.json" ]; then
    echo "Error: metadata.json not found. Run this script from the extension directory."
    exit 1
fi

mkdir -p "$EXTENSIONS_DIR"

if [ -L "$TARGET_DIR" ]; then
    echo "Removing existing symlink..."
    rm "$TARGET_DIR"
elif [ -d "$TARGET_DIR" ]; then
    echo "Removing existing directory..."
    rm -rf "$TARGET_DIR"
fi

ln -s "$SOURCE_DIR" "$TARGET_DIR"
echo "Symlink created successfully."
echo ""
echo "To activate the extension:"
echo "  1. Restart GNOME Shell (Alt+F2 → type 'r' → Enter) or log out/in"
echo "  2. Enable the extension:"
echo "     gnome-extensions enable $UUID"
echo ""
echo "To check status:"
echo "  gnome-extensions show $UUID"
