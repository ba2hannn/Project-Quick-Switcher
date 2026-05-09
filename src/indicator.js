import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { normalizeData } from './normalize.js';

export const ProjectQuickSwitcher = GObject.registerClass(
class ProjectQuickSwitcher extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'Project Quick Switcher');
        this._extension = extension;
        this._loadGeneration = 0;

        const icon = new St.Icon({
            icon_name: 'folder-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(icon);

        this._loadProjects();
    }

    _getProjectsFilePath() {
        return GLib.build_filenamev([this._extension.path, 'projects.json']);
    }

    _loadProjects() {
        this._loadGeneration++;
        const generation = this._loadGeneration;

        this.menu.removeAll();

        const file = Gio.File.new_for_path(this._getProjectsFilePath());
        file.load_contents_async(null, (sourceObject, result) => {
            if (generation !== this._loadGeneration) return;

            try {
                const [success, contents] = sourceObject.load_contents_finish(result);
                if (!success) {
                    this._addEmptyState();
                    return;
                }

                const raw = JSON.parse(new TextDecoder().decode(contents));
                const data = normalizeData(raw);
                const projects = data.projects;
                const groups = data.groups;

                if (!projects || projects.length === 0) {
                    this._addEmptyState();
                    return;
                }

                this._buildMenu(projects, groups);
            } catch (e) {
                log(`Project Quick Switcher: ${e.message}`);
                const errorItem = new PopupMenu.PopupMenuItem('Failed to load projects.json');
                errorItem.sensitive = false;
                this.menu.addMenuItem(errorItem);
            }
        });
    }

    _buildMenu(projects, groups) {
        for (const project of projects) {
            const submenu = new PopupMenu.PopupSubMenuMenuItem(project.name || 'Unnamed');

            const actions = project.actions || [];
            if (actions.length === 0) {
                const emptyItem = new PopupMenu.PopupMenuItem('  No actions');
                emptyItem.sensitive = false;
                submenu.menu.addMenuItem(emptyItem);
            } else {
                for (const action of actions) {
                    const item = new PopupMenu.PopupImageMenuItem(
                        action.label || 'Command',
                        action.icon || 'system-run-symbolic'
                    );
                    item.connect('activate', () => {
                        const steps = action.steps || [];
                        const workingDir = project.path || null;
                        if (steps.length > 0) {
                            for (const step of steps)
                                this._runCommand(step.command, workingDir, step.terminal);
                        } else if (action.command) {
                            this._runCommand(action.command, workingDir, action.terminal);
                        }
                    });
                    submenu.menu.addMenuItem(item);
                }
            }

            const projectGroups = (groups || []).filter(g =>
                (g.action_refs || []).some(r => r.project === project.name));
            if (projectGroups.length > 0) {
                submenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                for (const group of projectGroups) {
                    const groupItem = new PopupMenu.PopupImageMenuItem(
                        group.name || 'Unnamed Group',
                        group.icon || 'system-users-symbolic'
                    );
                    groupItem.connect('activate', () => {
                        this._runGroup(group, projects);
                    });
                    submenu.menu.addMenuItem(groupItem);
                }
            }

            this.menu.addMenuItem(submenu);
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const settingsItem = new PopupMenu.PopupMenuItem('Settings');
        settingsItem.connect('activate', () => {
            try {
                this._extension.openPreferences();
            } catch (e) {
                log(`Project Quick Switcher: ${e.message}`);
            }
        });
        this.menu.addMenuItem(settingsItem);
    }

    _addEmptyState() {
        const emptyItem = new PopupMenu.PopupMenuItem('No projects added yet');
        emptyItem.sensitive = false;
        this.menu.addMenuItem(emptyItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const settingsItem = new PopupMenu.PopupMenuItem('Settings');
        settingsItem.connect('activate', () => {
            this._extension.openPreferences();
        });
        this.menu.addMenuItem(settingsItem);
    }

    _runGroup(group, projects) {
        this._switchToWorkspace(group.workspace);

        for (const ref of group.action_refs || []) {
            const project = projects.find(p => p.name === ref.project);
            if (!project) {
                log(`Project Quick Switcher: Group "${group.name}" references unknown project "${ref.project}"`);
                continue;
            }
            const action = (project.actions || []).find(a => a.label === ref.action_label);
            if (!action) {
                log(`Project Quick Switcher: Group "${group.name}" references unknown action "${ref.action_label}" in project "${ref.project}"`);
                continue;
            }
            const steps = action.steps || [];
            const workingDir = project.path || null;
            if (steps.length > 0) {
                for (const step of steps)
                    this._runCommand(step.command, workingDir, step.terminal);
            } else if (action.command) {
                this._runCommand(action.command, workingDir, action.terminal);
            }
        }
    }

    _switchToWorkspace(workspace) {
        if (!workspace || workspace === 'current')
            return;

        const wsManager = global.workspace_manager;

        if (workspace === 'new') {
            const newIndex = wsManager.get_n_workspaces();
            wsManager.append_new_workspace(newIndex, true);
            return;
        }

        const targetIndex = workspace - 1;
        if (targetIndex < 0) return;

        while (wsManager.get_n_workspaces() <= targetIndex)
            wsManager.append_new_workspace(wsManager.get_n_workspaces(), false);

        wsManager.get_workspace_by_index(targetIndex).activate(global.get_current_time());
    }

    _runCommand(command, workingDir, inTerminal) {
        try {
            if (inTerminal) {
                const wrapped = `cd '${workingDir}' 2>/dev/null; ${command}; exec bash`;
                GLib.spawn_async(
                    null,
                    ['gnome-terminal', '--', 'bash', '-c', wrapped],
                    null,
                    GLib.SpawnFlags.SEARCH_PATH_FROM_ENVP,
                    null
                );
            } else {
                const envp = GLib.get_environ();
                GLib.spawn_async(
                    workingDir || null,
                    ['/bin/sh', '-c', command],
                    envp,
                    GLib.SpawnFlags.SEARCH_PATH_FROM_ENVP,
                    null
                );
            }
        } catch (e) {
            log(`Project Quick Switcher: Failed to run command: ${e.message}`);
        }
    }
});
