import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';

import { ActionRow } from './actionRow.js';

const REQUIRES = {
    claude: { bin: 'claude', install: 'npm install -g @anthropic-ai/claude-code' },
    aider: { bin: 'aider', install: 'python3 -m pip install --user -U aider-chat' },
    codex: { bin: 'codex', install: 'npm install -g @openai/codex' },
    gemini: { bin: 'gemini', install: 'npm install -g @google/gemini-cli' },
    llm: { bin: 'llm', install: 'python3 -m pip install --user -U llm' },
    pnpm: { bin: 'pnpm', install: 'npm install -g pnpm' },
    yarn: { bin: 'yarn', install: 'npm install -g yarn' },
    pytest: { bin: 'pytest', install: 'python3 -m pip install --user -U pytest' },
    ruff: { bin: 'ruff', install: 'python3 -m pip install --user -U ruff' },
    uv: { bin: 'uv', install: 'python3 -m pip install --user -U uv' },
    docker: { bin: 'docker', install: 'sudo apt install -y docker.io docker-compose-plugin' },
    tmux: { bin: 'tmux', install: 'sudo apt install -y tmux' },
    lazygit: { bin: 'lazygit', install: 'sudo apt install -y lazygit' },
    nvim: { bin: 'nvim', install: 'sudo apt install -y neovim' },
};

const PRESET_CATEGORIES = [
    {
        title: 'IDEs and Editors',
        icon: 'text-editor-symbolic',
        presets: [
            { label: 'VS Code', icon: 'text-editor-symbolic', steps: [{ command: 'code .', terminal: false }], hint: 'code .' },
            { label: 'Cursor', icon: 'text-editor-symbolic', steps: [{ command: 'cursor .', terminal: false }], hint: 'cursor .' },
            { label: 'Zed', icon: 'text-editor-symbolic', steps: [{ command: 'zed .', terminal: false }], hint: 'zed .' },
            { label: 'Neovim', icon: 'utilities-terminal-symbolic', steps: [{ command: 'nvim .', terminal: true, requires: REQUIRES.nvim }], hint: 'nvim .' },
            { label: 'JetBrains Toolbox', icon: 'applications-development-symbolic', steps: [{ command: 'jetbrains-toolbox', terminal: false }], hint: 'jetbrains-toolbox' },
            { label: 'Open Folder', icon: 'folder-open-symbolic', steps: [{ command: 'xdg-open .', terminal: false }], hint: 'xdg-open .' },
        ],
    },
    {
        title: 'AI Agents',
        icon: 'applications-science-symbolic',
        presets: [
            { label: 'Claude', icon: 'applications-science-symbolic', steps: [{ command: 'claude', terminal: true, requires: REQUIRES.claude }], hint: 'claude' },
            { label: 'Aider', icon: 'applications-science-symbolic', steps: [{ command: 'aider', terminal: true, requires: REQUIRES.aider }], hint: 'aider' },
            { label: 'OpenAI Codex CLI', icon: 'applications-science-symbolic', steps: [{ command: 'codex', terminal: true, requires: REQUIRES.codex }], hint: 'codex' },
            { label: 'Gemini CLI', icon: 'applications-science-symbolic', steps: [{ command: 'gemini', terminal: true, requires: REQUIRES.gemini }], hint: 'gemini' },
            { label: 'LLM CLI', icon: 'applications-science-symbolic', steps: [{ command: 'llm', terminal: true, requires: REQUIRES.llm }], hint: 'llm' },
            { label: 'GitHub Copilot (gh)', icon: 'applications-science-symbolic', steps: [{ command: 'gh copilot suggest', terminal: true }], hint: 'gh copilot suggest' },
        ],
    },
    {
        title: 'Git and Repo',
        icon: 'emblem-downloads-symbolic',
        presets: [
            { label: 'Git Pull', icon: 'emblem-downloads-symbolic', steps: [{ command: 'git pull', terminal: true }], hint: 'git pull' },
            { label: 'Git Pull (Rebase)', icon: 'emblem-downloads-symbolic', steps: [{ command: 'git pull --rebase', terminal: true }], hint: 'git pull --rebase' },
            { label: 'Git Fetch All', icon: 'emblem-synchronizing-symbolic', steps: [{ command: 'git fetch --all --prune', terminal: true }], hint: 'git fetch --all --prune' },
            { label: 'Git Status', icon: 'emblem-ok-symbolic', steps: [{ command: 'git status -sb', terminal: true }], hint: 'git status -sb' },
            { label: 'LazyGit', icon: 'utilities-terminal-symbolic', steps: [{ command: 'lazygit', terminal: true, requires: REQUIRES.lazygit }], hint: 'lazygit' },
        ],
    },
    {
        title: 'Node / JS',
        icon: 'applications-development-symbolic',
        presets: [
            { label: 'npm install', icon: 'applications-development-symbolic', steps: [{ command: 'npm install', terminal: true }], hint: 'npm install' },
            { label: 'npm run dev', icon: 'applications-development-symbolic', steps: [{ command: 'npm run dev', terminal: true }], hint: 'npm run dev' },
            { label: 'pnpm install', icon: 'applications-development-symbolic', steps: [{ command: 'pnpm install', terminal: true, requires: REQUIRES.pnpm }], hint: 'pnpm install' },
            { label: 'pnpm dev', icon: 'applications-development-symbolic', steps: [{ command: 'pnpm dev', terminal: true, requires: REQUIRES.pnpm }], hint: 'pnpm dev' },
            { label: 'yarn install', icon: 'applications-development-symbolic', steps: [{ command: 'yarn install', terminal: true, requires: REQUIRES.yarn }], hint: 'yarn install' },
            { label: 'yarn dev', icon: 'applications-development-symbolic', steps: [{ command: 'yarn dev', terminal: true, requires: REQUIRES.yarn }], hint: 'yarn dev' },
        ],
    },
    {
        title: 'Python',
        icon: 'applications-development-symbolic',
        presets: [
            { label: 'Create venv + deps', icon: 'applications-development-symbolic', steps: [{ command: 'python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt', terminal: true }], hint: 'python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt' },
            { label: 'uv sync', icon: 'applications-development-symbolic', steps: [{ command: 'uv sync', terminal: true, requires: REQUIRES.uv }], hint: 'uv sync' },
            { label: 'pytest', icon: 'applications-development-symbolic', steps: [{ command: 'pytest -q', terminal: true, requires: REQUIRES.pytest }], hint: 'pytest -q' },
            { label: 'ruff check', icon: 'applications-development-symbolic', steps: [{ command: 'ruff check .', terminal: true, requires: REQUIRES.ruff }], hint: 'ruff check .' },
        ],
    },
    {
        title: 'Docker',
        icon: 'system-run-symbolic',
        presets: [
            { label: 'Docker Up', icon: 'system-run-symbolic', steps: [{ command: 'docker compose up -d', terminal: true, requires: REQUIRES.docker }], hint: 'docker compose up -d' },
            { label: 'Docker Down', icon: 'system-run-symbolic', steps: [{ command: 'docker compose down', terminal: true, requires: REQUIRES.docker }], hint: 'docker compose down' },
            { label: 'Docker Logs', icon: 'system-run-symbolic', steps: [{ command: 'docker compose logs -f --tail=200', terminal: true, requires: REQUIRES.docker }], hint: 'docker compose logs -f --tail=200' },
            { label: 'Docker Start', icon: 'system-run-symbolic', template: 'docker-start', hint: 'docker start <container>' },
        ],
    },
    {
        title: 'Terminal Tools',
        icon: 'utilities-terminal-symbolic',
        presets: [
            { label: 'Terminal', icon: 'utilities-terminal-symbolic', steps: [{ command: 'exec bash', terminal: true }], hint: 'exec bash' },
            { label: 'tmux (attach/new)', icon: 'utilities-terminal-symbolic', steps: [{ command: 'tmux new -A -s dev', terminal: true, requires: REQUIRES.tmux }], hint: 'tmux new -A -s dev' },
            { label: 'htop', icon: 'utilities-terminal-symbolic', steps: [{ command: 'htop', terminal: true }], hint: 'htop' },
            { label: 'btop', icon: 'utilities-terminal-symbolic', steps: [{ command: 'btop', terminal: true }], hint: 'btop' },
        ],
    },
];

export const ProjectPage = GObject.registerClass(
class ProjectPage extends Adw.PreferencesPage {
    _init(projectData = {}, onSave, onBack = null) {
        super._init({
            title: projectData.name || 'New Project',
            icon_name: projectData.icon || 'folder-symbolic',
        });

        this._onSave = onSave;
        this._onBack = onBack;
        this._actionRows = [];

        this.projectData = {
            name: projectData.name || '',
            path: projectData.path || '',
            icon: projectData.icon || 'folder-symbolic',
        };

        if (this._onBack) {
            const navGroup = new Adw.PreferencesGroup();
            const backRow = new Adw.ActionRow({
                title: 'Back to Projects',
                activatable: true,
            });
            backRow.add_prefix(new Gtk.Image({
                icon_name: 'go-previous-symbolic',
                valign: Gtk.Align.CENTER,
            }));
            backRow.connect('activated', () => this._onBack?.());
            navGroup.add(backRow);
            this.add(navGroup);
        }

        const infoGroup = new Adw.PreferencesGroup({
            title: 'Project Info',
            description: 'Set the name and location of your project folder.',
        });

        const nameRow = new Adw.EntryRow({
            title: 'Project Name',
            text: this.projectData.name,
        });
        nameRow.connect('changed', () => {
            this.projectData.name = nameRow.text;
            this.title = nameRow.text || 'New Project';
            this._onSave?.();
        });
        infoGroup.add(nameRow);

        const pathRow = new Adw.EntryRow({
            title: 'Project Path',
            text: this.projectData.path,
        });
        pathRow.connect('changed', () => {
            this.projectData.path = pathRow.text;
            this._onSave?.();
        });
        infoGroup.add(pathRow);

        const browseButton = new Gtk.Button({
            icon_name: 'folder-open-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
            tooltip_text: 'Browse for a folder',
        });
        browseButton.connect('clicked', () => {
            const chooser = new Gtk.FileDialog();
            chooser.set_title('Select Project Folder');
            chooser.select_folder(this.get_root(), null, (dialog, result) => {
                try {
                    const folder = dialog.select_folder_finish(result);
                    const path = folder.get_path();
                    pathRow.text = path;
                    this.projectData.path = path;
                    this._onSave?.();
                } catch (_e) { /* cancelled */ }
            });
        });
        pathRow.add_suffix(browseButton);

        const iconRow = new Adw.EntryRow({
            title: 'Icon Name',
            text: this.projectData.icon,
        });
        iconRow.connect('changed', () => {
            this.projectData.icon = iconRow.text || 'folder-symbolic';
            this.icon_name = this.projectData.icon;
            this._onSave?.();
        });
        infoGroup.add(iconRow);

        this.add(infoGroup);

        this._actionsGroup = new Adw.PreferencesGroup({
            title: 'Actions',
            description: 'Each action can have multiple steps. All steps run when the action is triggered.',
        });

        const addButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
            tooltip_text: 'Add a new action',
        });
        addButton.connect('clicked', () => {
            this._addAction();
            this._onSave?.();
        });
        this._actionsGroup.set_header_suffix(addButton);

        this.add(this._actionsGroup);

        for (const action of projectData.actions || [])
            this._addAction(action);

        const quickGroup = new Adw.PreferencesGroup({
            title: 'Quick Actions',
            description: 'Expand a category and click to add a preset action.',
        });

        for (const category of PRESET_CATEGORIES) {
            const expander = new Adw.ExpanderRow({
                title: category.title || 'Category',
                icon_name: category.icon || 'folder-symbolic',
            });

            const flowBox = new Gtk.FlowBox({
                selection_mode: Gtk.SelectionMode.NONE,
                column_spacing: 8,
                row_spacing: 8,
                max_children_per_line: 3,
                min_children_per_line: 2,
                margin_top: 8,
                margin_bottom: 8,
                margin_start: 12,
                margin_end: 12,
            });

            for (const preset of (category.presets || [])) {
                const box = new Gtk.Box({
                    orientation: Gtk.Orientation.HORIZONTAL,
                    spacing: 4,
                });

                const btn = new Gtk.Button({
                    label: `+ ${preset.label}`,
                    css_classes: ['pill', 'suggested-action'],
                });
                btn.connect('clicked', () => {
                    if (preset.template === 'docker-start') {
                        this._showInputDialog(preset);
                    } else {
                        this._addAction(preset);
                        this._onSave?.();
                    }
                });
                box.append(btn);

                const infoBtn = new Gtk.Button({
                    icon_name: 'dialog-information-symbolic',
                    css_classes: ['flat'],
                    valign: Gtk.Align.CENTER,
                    tooltip_text: preset.hint || preset.label,
                });
                infoBtn.connect('clicked', () => {
                    const popover = new Gtk.Popover({
                        child: new Gtk.Label({
                            label: preset.hint || preset.label,
                            margin_top: 8,
                            margin_bottom: 8,
                            margin_start: 12,
                            margin_end: 12,
                            wrap: true,
                        }),
                        has_arrow: true,
                        position: Gtk.PositionType.BOTTOM,
                    });
                    popover.set_parent(infoBtn);
                    popover.popup();
                });
                box.append(infoBtn);

                flowBox.append(box);
            }

            if ((category.presets || []).length === 0) {
                flowBox.append(new Gtk.Label({
                    label: 'No presets in this category',
                    css_classes: ['dim-label'],
                }));
            }

            const flowRow = new Adw.ActionRow({ activatable: false });
            flowRow.set_child(flowBox);
            expander.add_row(flowRow);

            quickGroup.add(expander);
        }

        this.add(quickGroup);
    }

    _showInputDialog(preset) {
        const dialog = new Adw.MessageDialog({
            heading: preset.label,
            body: 'Container name:',
            transient_for: this.get_root(),
        });

        const entry = new Gtk.Entry({
            placeholder_text: 'e.g. my_app_db',
            hexpand: true,
        });
        dialog.set_extra_child(entry);

        dialog.add_response('cancel', 'Cancel');
        dialog.add_response('add', 'Add');
        dialog.set_response_appearance('add', Adw.ResponseAppearance.SUGGESTED);

        dialog.connect('response', (_dialog, response) => {
            if (response === 'add') {
                const name = entry.text.trim();
                if (name) {
                    this._addAction({
                        label: `Docker Start (${name})`,
                        icon: preset.icon,
                        steps: [{ command: `docker start ${name}`, terminal: true, requires: REQUIRES.docker }],
                    });
                    this._onSave?.();
                }
            }
            dialog.destroy();
        });

        dialog.present();
    }

    _addAction(data = {}) {
        const row = new ActionRow(data, this._onSave, () => {
            const idx = this._actionRows.indexOf(row);
            if (idx !== -1)
                this._actionRows.splice(idx, 1);
        });
        this._actionRows.push(row);
        this._actionsGroup.add(row);
    }

    getProjectData() {
        const actions = this._actionRows.map(r => r.getActionData());
        return { ...this.projectData, actions };
    }
});
