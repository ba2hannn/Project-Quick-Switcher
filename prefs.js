import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { normalizeData } from './src/normalize.js';
import { ProjectPage } from './src/projectPage.js';
import { GroupEditorPage } from './src/groupEditorPage.js';

export default class ProjectQuickSwitcherPrefs extends ExtensionPreferences {
    _projectPages = [];
    _groupPages = [];
    _autoSaveId = 0;

    fillPreferencesWindow(window) {
        window.set_default_size(800, 700);
        window.set_title('Project Quick Switcher');

        this._projectPages = [];
        this._groupPages = [];
        this._window = window;

        window.connect('close-request', () => {
            if (this._autoSaveId) {
                GLib.source_remove(this._autoSaveId);
                this._autoSaveId = 0;
            }
            this._listGroup = null;
            this._groupsListGroup = null;
            this._projectPages = [];
            this._groupPages = [];
        });

        this._loadData();

        // --- Projects Overview Page ---
        const overviewPage = new Adw.PreferencesPage({
            title: 'Projects',
            icon_name: 'folder-symbolic',
        });

        this._listGroup = new Adw.PreferencesGroup({
            title: 'Your Projects',
            description: 'Click a project to edit its actions and settings.',
        });

        const addButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
            tooltip_text: 'Add a new project',
        });
        addButton.connect('clicked', () => this._addProject(window));
        this._listGroup.set_header_suffix(addButton);

        overviewPage.add(this._listGroup);
        window.add(overviewPage);

        for (const data of this._projectsData)
            this._addProjectPage(window, data);

        this._refreshList();

        // --- Groups Page ---
        const groupsPage = new Adw.PreferencesPage({
            title: 'Groups',
            icon_name: 'system-users-symbolic',
        });

        this._groupsListGroup = new Adw.PreferencesGroup({
            title: 'Your Groups',
            description: 'Groups run multiple actions from different projects at once. Optionally on a specific workspace.',
        });

        const addGroupButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
            tooltip_text: 'Add a new group',
        });
        addGroupButton.connect('clicked', () => this._addGroup(window));
        this._groupsListGroup.set_header_suffix(addGroupButton);

        groupsPage.add(this._groupsListGroup);
        window.add(groupsPage);

        for (const gData of this._groupsData)
            this._addGroupPage(window, gData);

        this._refreshGroupList();
    }

    _getProjectsFilePath() {
        return GLib.build_filenamev([this.path, 'projects.json']);
    }

    _loadData() {
        try {
            const file = Gio.File.new_for_path(this._getProjectsFilePath());
            const [success, contents] = file.load_contents(null);
            if (success) {
                const raw = JSON.parse(new TextDecoder().decode(contents));
                const normalized = normalizeData(raw);
                this._projectsData = normalized.projects;
                this._groupsData = normalized.groups;
                return;
            }
        } catch (_e) { }
        this._projectsData = [];
        this._groupsData = [];
    }

    _scheduleAutoSave(window) {
        if (this._autoSaveId)
            GLib.source_remove(this._autoSaveId);
        this._autoSaveId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            this._doSave(window);
            this._autoSaveId = 0;
            return GLib.SOURCE_REMOVE;
        });
    }

    _doSave(window) {
        const projects = this._projectPages.map(p => p.getProjectData());
        const groups = this._groupPages.map(g => g.getGroupData());

        try {
            const json = JSON.stringify({ projects, groups }, null, 2);
            const file = Gio.File.new_for_path(this._getProjectsFilePath());
            file.replace_contents(
                new TextEncoder().encode(json),
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );

            window.add_toast(new Adw.Toast({ title: 'Saved', timeout: 2 }));
        } catch (e) {
            log(`Project Quick Switcher: Save failed: ${e.message}`);
            window.add_toast(new Adw.Toast({ title: `Save failed: ${e.message}`, timeout: 3 }));
        }
    }

    _addProjectPage(window, data) {
        const page = new ProjectPage(data, () => this._scheduleAutoSave(window));
        window.add(page);
        this._projectPages.push(page);
        return page;
    }

    _addProject(window) {
        const newData = { name: 'New Project', path: '', icon: 'folder-symbolic', actions: [] };
        const page = this._addProjectPage(window, newData);
        this._refreshList();
        window.set_visible_page(page);
    }

    _removeProject(window, pageRef) {
        const idx = this._projectPages.indexOf(pageRef);
        if (idx === -1) return;
        this._projectPages.splice(idx, 1);
        window.remove(pageRef);
        this._refreshList();
        this._doSave(window);
    }

    _refreshList() {
        let child = this._listGroup.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            if (child instanceof Adw.ActionRow || child instanceof Adw.ExpanderRow)
                this._listGroup.remove(child);
            child = next;
        }

        if (this._projectPages.length === 0) {
            const emptyRow = new Adw.ActionRow({
                title: 'No projects yet',
                subtitle: 'Click + to add your first project',
            });
            emptyRow.sensitive = false;
            this._listGroup.add(emptyRow);
            return;
        }

        for (const page of this._projectPages) {
            const name = page.projectData.name || 'Unnamed';
            const actionCount = page._actionRows.length;
            const path = page.projectData.path;

            const row = new Adw.ActionRow({
                title: name,
                subtitle: path || 'No path set',
                activatable: true,
            });

            row.add_prefix(new Gtk.Image({
                icon_name: page.projectData.icon || 'folder-symbolic',
                valign: Gtk.Align.CENTER,
            }));

            const countLabel = new Gtk.Label({
                label: `${actionCount} action${actionCount !== 1 ? 's' : ''}`,
                css_classes: ['caption', 'dimmed'],
                valign: Gtk.Align.CENTER,
            });
            row.add_suffix(countLabel);

            row.add_suffix(new Gtk.Image({
                icon_name: 'go-next-symbolic',
                valign: Gtk.Align.CENTER,
                css_classes: ['dimmed'],
            }));

            const pageRef = page;
            row.connect('activated', () => {
                row.get_root().set_visible_page(pageRef);
            });

            const deleteButton = new Gtk.Button({
                icon_name: 'user-trash-symbolic',
                valign: Gtk.Align.CENTER,
                css_classes: ['flat', 'error'],
                tooltip_text: 'Delete this project',
            });
            deleteButton.connect('clicked', () => {
                this._removeProject(row.get_root(), pageRef);
            });
            row.add_suffix(deleteButton);

            this._listGroup.add(row);
        }
    }

    // --- Groups ---

    _addGroupPage(window, data) {
        const page = new GroupEditorPage(data, this._projectsData, () => this._scheduleAutoSave(window));
        window.add(page);
        this._groupPages.push(page);
        return page;
    }

    _addGroup(window) {
        const newData = { name: 'New Group', icon: 'system-users-symbolic', action_refs: [] };
        const page = this._addGroupPage(window, newData);
        this._refreshGroupList();
        window.set_visible_page(page);
    }

    _removeGroup(window, pageRef) {
        const idx = this._groupPages.indexOf(pageRef);
        if (idx === -1) return;
        this._groupPages.splice(idx, 1);
        window.remove(pageRef);
        this._refreshGroupList();
        this._doSave(window);
    }

    _refreshGroupList() {
        let child = this._groupsListGroup.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            if (child instanceof Adw.ActionRow || child instanceof Adw.ExpanderRow)
                this._groupsListGroup.remove(child);
            child = next;
        }

        if (this._groupPages.length === 0) {
            const emptyRow = new Adw.ActionRow({
                title: 'No groups yet',
                subtitle: 'Click + to combine actions from different projects',
            });
            emptyRow.sensitive = false;
            this._groupsListGroup.add(emptyRow);
            return;
        }

        for (const page of this._groupPages) {
            const name = page.groupData.name || 'Unnamed';
            const groupData = page.getGroupData();
            const actionCount = (groupData.action_refs || []).length;
            const ws = page.groupData.workspace;
            const wsLabel = ws === 'new' ? 'New workspace' :
                            ws === 'current' || !ws ? '' :
                            `Workspace ${ws}`;
            const parts = [`${actionCount} action${actionCount !== 1 ? 's' : ''}`];
            if (wsLabel) parts.push(wsLabel);
            const subtitle = parts.join(' · ');

            const row = new Adw.ActionRow({
                title: name,
                subtitle,
                activatable: true,
            });

            row.add_prefix(new Gtk.Image({
                icon_name: page.groupData.icon || 'system-users-symbolic',
                valign: Gtk.Align.CENTER,
            }));

            row.add_suffix(new Gtk.Image({
                icon_name: 'go-next-symbolic',
                valign: Gtk.Align.CENTER,
                css_classes: ['dimmed'],
            }));

            const pageRef = page;
            row.connect('activated', () => {
                row.get_root().set_visible_page(pageRef);
            });

            const deleteButton = new Gtk.Button({
                icon_name: 'user-trash-symbolic',
                valign: Gtk.Align.CENTER,
                css_classes: ['flat', 'error'],
                tooltip_text: 'Delete this group',
            });
            deleteButton.connect('clicked', () => {
                this._removeGroup(row.get_root(), pageRef);
            });
            row.add_suffix(deleteButton);

            this._groupsListGroup.add(row);
        }
    }
}
