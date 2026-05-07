import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const ProjectQuickSwitcher = GObject.registerClass(
class ProjectQuickSwitcher extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'Project Quick Switcher');

        this._extension = extension;

        const icon = new St.Icon({
            icon_name: 'folder-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(icon);

        this._loadProjects();
    }

    _getProjectsFilePath() {
        const dir = this._extension.path;
        return GLib.build_filenamev([dir, 'projects.json']);
    }

    _loadProjects() {
        this.menu.removeAll();

        try {
            const file = Gio.File.new_for_path(this._getProjectsFilePath());
            const [success, contents] = file.load_contents(null);
            if (!success) return;

            const decoder = new TextDecoder();
            const projects = JSON.parse(decoder.decode(contents));

            if (!projects || projects.length === 0) {
                this.menu.addMenuItem(new PopupMenu.PopupMenuItem('No projects configured'));
                return;
            }

            const section = new PopupMenu.PopupMenuSection();

            for (const project of projects) {
                const item = new PopupMenu.PopupMenuItem(project.name || 'Unnamed');
                item.connect('activate', () => {
                    this._launchProject(project);
                });
                section.addMenuItem(item);
            }

            this.menu.addMenuItem(section);
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            const reloadItem = new PopupMenu.PopupMenuItem('Reload Projects');
            reloadItem.connect('activate', () => this._loadProjects());
            this.menu.addMenuItem(reloadItem);

        } catch (e) {
            log(`Project Quick Switcher: Failed to load projects: ${e.message}`);
            const errorItem = new PopupMenu.PopupMenuItem('Error loading projects.json');
            this.menu.addMenuItem(errorItem);
        }
    }

    _launchProject(project) {
        try {
            const cmd = project.editor_command || 'xdg-open';
            const args = [cmd];

            if (project.path) {
                args.push(project.path);
            }

            GLib.spawn_async(
                project.path || null,
                args,
                null,
                GLib.SpawnFlags.SEARCH_PATH_FROM_ENVP,
                null
            );
        } catch (e) {
            log(`Project Quick Switcher: Failed to launch project: ${e.message}`);
        }
    }
});

export default class ProjectQuickSwitcherExtension extends Extension {
    enable() {
        this._indicator = new ProjectQuickSwitcher(this);
        const { main } = imports.ui;
        main.panel.addToStatusArea('project-quick-switcher', this._indicator);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
