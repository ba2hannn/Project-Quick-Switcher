# Project Quick Switcher

A GNOME Shell extension that adds a panel button for quickly switching between your projects. Launch your favorite editor or AI agent with a single click.

![GNOME 46+](https://img.shields.io/badge/GNOME-46%2B-blue)

## Features

- Panel button with a folder icon in the top bar
- Dropdown menu listing all configured projects
- One-click launch of your editor in the project directory
- Editable JSON configuration — no GUI needed
- Reload projects without restarting the extension

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/ba2hannn/Project-Quick-Switcher.git
cd Project-Quick-Switcher
```

### 2. Run the install script

```bash
chmod +x install.sh
./install.sh
```

This creates a symlink from `~/.local/share/gnome-shell/extensions/project-quick-switcher@ba2hann.github.com` to the cloned repository.

### 3. Restart GNOME Shell

- **X11:** Press `Alt+F2`, type `r`, and press Enter.
- **Wayland:** Log out and log back in.

### 4. Enable the extension

```bash
gnome-extensions enable project-quick-switcher@ba2hann.github.com
```

## Configuration

Edit the `projects.json` file in the extension directory to define your projects:

```json
[
  {
    "name": "My Project",
    "path": "/home/user/projects/my-project",
    "editor_command": "code",
    "agent_command": "claude"
  }
]
```

### Project properties

| Field            | Description                                        | Required |
|------------------|----------------------------------------------------|----------|
| `name`           | Display name shown in the dropdown menu            | Yes      |
| `path`           | Absolute path to the project directory             | Yes      |
| `editor_command` | Command to launch the editor (e.g., `code`, `vim`) | Yes      |
| `agent_command`  | Command for AI agent (e.g., `claude`) — reserved   | No       |

After editing `projects.json`, click **Reload Projects** in the dropdown menu to apply changes.

## Uninstall

```bash
rm ~/.local/share/gnome-shell/extensions/project-quick-switcher@ba2hann.github.com
```

Then restart GNOME Shell.

## License

MIT
