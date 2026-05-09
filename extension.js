import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { ProjectQuickSwitcher } from './src/indicator.js';

export default class ProjectQuickSwitcherExtension extends Extension {
    enable() {
        this._indicator = new ProjectQuickSwitcher(this);
        Main.panel.addToStatusArea('project-quick-switcher', this._indicator);
        this._setupFileMonitor();
    }

    disable() {
        if (this._reloadTimeoutId) {
            GLib.source_remove(this._reloadTimeoutId);
            this._reloadTimeoutId = null;
        }
        if (this._fileMonitor) {
            this._fileMonitor.cancel();
            this._fileMonitor = null;
        }
        this._indicator?.destroy();
        this._indicator = null;
    }

    _setupFileMonitor() {
        const file = Gio.File.new_for_path(
            GLib.build_filenamev([this.path, 'projects.json'])
        );
        this._fileMonitor = file.monitor_file(
            Gio.FileMonitorFlags.WATCH_MOVES,
            null
        );
        this._fileMonitor.connect('changed', (monitor, file, otherFile, eventType) => {
            if (eventType === Gio.FileMonitorEvent.ATTRIBUTE_CHANGED ||
                eventType === Gio.FileMonitorEvent.PRE_UNMOUNT ||
                eventType === Gio.FileMonitorEvent.UNMOUNTED)
                return;

            if (this._reloadTimeoutId)
                GLib.source_remove(this._reloadTimeoutId);
            this._reloadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                this._indicator?._loadProjects();
                this._reloadTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            });
        });
    }
}
