import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';

import { ActionRow } from './actionRow.js';

const PRESET_CATEGORIES = [
    {
        title: 'Editors',
        icon: 'text-editor-symbolic',
        presets: [
            { label: 'VS Code', icon: 'text-editor-symbolic', steps: [{ command: 'code .', terminal: false }], hint: 'code .' },
        ],
    },
    {
        title: 'AI Tools',
        icon: 'applications-science-symbolic',
        presets: [
            { label: 'Claude', icon: 'applications-science-symbolic', steps: [{ command: 'claude', terminal: true }], hint: 'claude' },
            { label: 'Aider', icon: 'applications-science-symbolic', steps: [{ command: 'aider', terminal: true }], hint: 'aider' },
        ],
    },
    {
        title: 'Docker',
        icon: 'system-run-symbolic',
        presets: [
            { label: 'Docker Up', icon: 'system-run-symbolic', steps: [{ command: 'docker compose up -d', terminal: false }], hint: 'docker compose up -d' },
            { label: 'Docker Start', icon: 'system-run-symbolic', template: 'docker-start', hint: 'docker start <container>' },
        ],
    },
    {
        title: 'Terminal',
        icon: 'utilities-terminal-symbolic',
        presets: [
            { label: 'Terminal', icon: 'utilities-terminal-symbolic', steps: [{ command: 'exec bash', terminal: true }], hint: 'exec bash' },
        ],
    },
    {
        title: 'Git',
        icon: 'emblem-downloads-symbolic',
        presets: [
            { label: 'Git Pull', icon: 'emblem-downloads-symbolic', steps: [{ command: 'git pull', terminal: true }], hint: 'git pull' },
        ],
    },
];

export const ProjectPage = GObject.registerClass(
class ProjectPage extends Adw.PreferencesPage {
    _init(projectData = {}, onSave) {
        super._init({
            title: projectData.name || 'New Project',
            icon_name: projectData.icon || 'folder-symbolic',
        });

        this._onSave = onSave;
        this._actionRows = [];

        this.projectData = {
            name: projectData.name || '',
            path: projectData.path || '',
            icon: projectData.icon || 'folder-symbolic',
        };

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
                title: category.title,
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

            for (const preset of category.presets) {
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
                        steps: [{ command: `docker start ${name}`, terminal: false }],
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
