# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GNOME Shell extension (GNOME 46+) that adds a panel button for switching between projects and launching commands (editors, terminals, Docker, AI agents) with a single click.

## Development Setup

```bash
# Install as symlink (from repo root)
./install.sh

# Restart GNOME Shell
# X11: Alt+F2 → 'r' → Enter
# Wayland: log out/in

# Enable
gnome-extensions enable project-quick-switcher@ba2hann.github.com

# Check status
gnome-extensions show project-quick-switcher@ba2hann.github.com

# View logs (extension errors)
journalctl -f -o cat /usr/lib/gnome-shell
```

No build step — GNOME loads ESM files directly from the extension directory.

## Architecture

Two entry points loaded by GNOME Shell, with logic split into `src/` modules:

### Entry Points
- **`extension.js`** — Extension lifecycle (enable/disable, file monitor). Imports `ProjectQuickSwitcher` from `src/indicator.js`.
- **`prefs.js`** — Preferences window (`Adw.PreferencesWindow`). Imports widget classes from `src/`. Handles save/load and project/group list management.

### `src/` Modules
- **`src/normalize.js`** — Shared `normalizeData()` for backward-compatible JSON parsing.
- **`src/indicator.js`** — `ProjectQuickSwitcher` panel button. Builds popup menu from projects/groups, runs commands.
- **`src/stepRow.js`** — `StepRow` widget (single command row with terminal toggle).
- **`src/actionRow.js`** — `ActionRow` widget (expandable row holding `StepRow` instances).
- **`src/projectPage.js`** — `ProjectPage` widget + `PRESET_CATEGORIES`. Full project editor with quick-add presets.
- **`src/groupEditorPage.js`** — `GroupEditorPage` widget. Group editor with workspace selector and action checkboxes.

### Data
- **`projects.json`** — `{ projects: [{ name, path, icon, actions }], groups: [{ name, icon, workspace, action_refs }] }`.

## Key Conventions

- GNOME Shell ESM imports: `gi://St`, `gi://Gio`, etc. for GObject introspection; `resource:///org/gnome/shell/...` for shell APIs.
- Custom widgets are `GObject.registerClass()` subclasses — always call `super._init()` and use `connect()` for signals.
- No npm/node — this is purely GNOME JS (GJS). No build, no bundler, no tests.
- Extension UUID: `project-quick-switcher@ba2hann.github.com`
