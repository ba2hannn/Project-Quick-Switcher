<div align="center">

# Project Quick Switcher

**One-click project launcher for GNOME Shell**

Launch your editor, terminal, Docker containers, and AI agents — all from the top panel.

![GNOME 46+](https://img.shields.io/badge/GNOME-46%2B-4A90D9?style=flat-square)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![ESM](https://img.shields.io/badge/GJS-ESM-orange?style=flat-square)

</div>

---

## What It Does

Project Quick Switcher adds a folder icon to your GNOME top panel. Click it to see all your projects, each with its own submenu of actions. One click launches VS Code in your project directory, starts a Docker container, opens Claude Code, or runs any custom command you want.

You can also create **Groups** — bundles of actions from different projects that run together on a specific workspace. Perfect for spinning up an entire development environment in one click.

## Features

- **Panel menu** — All your projects, one click away
- **Multi-step actions** — Chain multiple commands in a single action
- **Groups** — Run actions from multiple projects at once, optionally on a specific workspace
- **Terminal support** — Toggle any step to run in a terminal that stays open
- **Quick-add presets** — One-click presets for VS Code, Claude, Aider, Docker, Git, and more
- **Live reload** — Changes are reflected instantly, no restart needed
- **Modern UI** — Native Adwaita/GTK 4 preferences window with auto-save
- **Zero dependencies** — Pure GNOME JS (GJS), no Node, no build step

## Installation

### From Source

```bash
git clone https://github.com/ba2hannn/Project-Quick-Switcher.git
cd Project-Quick-Switcher
./install.sh
```

Then restart GNOME Shell (**X11:** `Alt+F2` → `r` → Enter / **Wayland:** log out and back in) and enable:

```bash
gnome-extensions enable project-quick-switcher@ba2hann.github.com
```

### Uninstall

```bash
gnome-extensions disable project-quick-switcher@ba2hann.github.com
rm ~/.local/share/gnome-shell/extensions/project-quick-switcher@ba2hann.github.com
```

## How to Use

1. Click the **folder icon** in the top panel
2. Expand a project to see its actions
3. Click any action to run it — commands execute in your project directory
4. Open **Settings** from the bottom of the menu to manage projects and groups

## Configuration

Everything is configurable through the GUI. You can also edit `projects.json` by hand.

### Project Structure

```json
{
  "projects": [
    {
      "name": "My Web App",
      "path": "/home/user/projects/my-web-app",
      "icon": "folder-symbolic",
      "actions": [
        {
          "label": "VS Code",
          "icon": "text-editor-symbolic",
          "steps": [
            { "command": "code .", "terminal": false }
          ]
        },
        {
          "label": "Docker Up",
          "icon": "system-run-symbolic",
          "steps": [
            { "command": "docker compose up -d", "terminal": false }
          ]
        }
      ]
    }
  ],
  "groups": [
    {
      "name": "Full Startup",
      "icon": "system-users-symbolic",
      "workspace": "new",
      "action_refs": [
        { "project": "My Web App", "action_label": "VS Code" },
        { "project": "My Web App", "action_label": "Docker Up" }
      ]
    }
  ]
}
```

### Project Fields

| Field | Description | Default |
|---|---|---|
| `name` | Display name in the panel menu | — |
| `path` | Absolute path to the project directory | — |
| `icon` | Freedesktop icon name | `folder-symbolic` |
| `actions` | List of actions for this project | `[]` |

### Action Fields

| Field | Description | Default |
|---|---|---|
| `label` | Display name for the action | — |
| `icon` | Freedesktop icon name | `system-run-symbolic` |
| `steps` | List of sequential commands to run | `[]` |

### Step Fields

| Field | Description | Default |
|---|---|---|
| `command` | Shell command to run | — |
| `terminal` | Run in a terminal that stays open | `false` |

### Group Fields

| Field | Description | Default |
|---|---|---|
| `name` | Display name | — |
| `icon` | Freedesktop icon name | `system-users-symbolic` |
| `workspace` | `current`, `new`, or a workspace number (1–6) | `current` |
| `action_refs` | List of `{ project, action_label }` references | `[]` |

### Quick-Add Presets

Available in the preferences window under **Quick Actions**:

| Category | Preset | Command |
|---|---|---|
| Editors | VS Code | `code .` |
| AI Tools | Claude | `claude` |
| AI Tools | Aider | `aider` |
| Docker | Docker Up | `docker compose up -d` |
| Docker | Docker Start | `docker start <name>` |
| Terminal | Terminal | `exec bash` |
| Git | Git Pull | `git pull` |

## Development

No build step — GNOME loads the ESM files directly.

```bash
# Install as symlink for development
./install.sh

# View extension logs
journalctl -f -o cat /usr/lib/gnome-shell
```

### Project Structure

```
extension.js          Entry point — extension lifecycle
prefs.js              Entry point — preferences window
src/
  indicator.js        Panel button and popup menu
  projectPage.js      Project editor page + presets
  groupEditorPage.js  Group editor page
  actionRow.js        Action row widget
  stepRow.js          Step row widget
  normalize.js        Shared data normalization
projects.json         User data (projects + groups)
```

## License

[MIT](LICENSE) — Ba2hann
