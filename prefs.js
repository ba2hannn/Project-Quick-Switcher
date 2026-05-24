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
    _settingsData = { auto_install_missing_tools: false };
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
            this._projectsOverviewPage = null;
            this._groupsOverviewPage = null;
            this._projectPages = [];
            this._groupPages = [];
            this._settingsData = { auto_install_missing_tools: false };
        });

        this._loadData();

        // --- Projects Overview Page ---
        this._projectsOverviewPage = new Adw.PreferencesPage({
            title: 'Projects',
            icon_name: 'folder-symbolic',
        });
        this._listGroup = null;
        window.add(this._projectsOverviewPage);

        for (const data of this._projectsData)
            this._addProjectPage(window, data);

        this._refreshList();

        // --- Groups Page ---
        this._groupsOverviewPage = new Adw.PreferencesPage({
            title: 'Groups',
            icon_name: 'system-users-symbolic',
        });
        this._groupsListGroup = null;
        window.add(this._groupsOverviewPage);

        for (const gData of this._groupsData)
            this._addGroupPage(window, gData);

        this._refreshGroupList();
    }

    _createProjectsListGroup(window) {
        const listGroup = new Adw.PreferencesGroup({
            title: 'Your Projects',
            description: 'Click a project to edit its actions and settings.',
        });

        const autoInstallRow = new Adw.SwitchRow({
            title: 'Auto-install missing tools for Quick Actions',
            subtitle: 'When enabled, preset actions can install missing CLI tools before running.',
            active: !!this._settingsData.auto_install_missing_tools,
        });
        autoInstallRow.connect('notify::active', () => {
            this._settingsData.auto_install_missing_tools = autoInstallRow.active;
            this._scheduleAutoSave(window);
        });
        listGroup.add(autoInstallRow);

        const addButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
            tooltip_text: 'Add a new project',
        });
        addButton.connect('clicked', () => this._addProject(window));
        listGroup.set_header_suffix(addButton);

        return listGroup;
    }

    _createGroupsListGroup(window) {
        const groupsListGroup = new Adw.PreferencesGroup({
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
        groupsListGroup.set_header_suffix(addGroupButton);

        return groupsListGroup;
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
                this._settingsData = normalized.settings;
                return;
            }
        } catch (_e) { }
        this._projectsData = [];
        this._groupsData = [];
        this._settingsData = { auto_install_missing_tools: false };
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
        const settings = { ...this._settingsData };

        try {
            const json = JSON.stringify({ projects, groups, settings }, null, 2);
            const file = Gio.File.new_for_path(this._getProjectsFilePath());
            file.replace_contents(
                new TextEncoder().encode(json),
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );

            this._refreshList();
            this._refreshGroupList();
            window.add_toast(new Adw.Toast({ title: 'Saved', timeout: 2 }));
        } catch (e) {
            log(`Project Quick Switcher: Save failed: ${e.message}`);
            window.add_toast(new Adw.Toast({ title: `Save failed: ${e.message}`, timeout: 3 }));
        }
    }

    _getCurrentProjectsData() {
        return this._projectPages.map(p => p.getProjectData());
    }

    _showEditorPage(page) {
        if (!this._window)
            return;
        if (typeof this._window.present_subpage === 'function')
            this._window.present_subpage(page);
        else
            this._window.set_visible_page(page);
    }

    _closeEditorPage(fallbackPage) {
        if (!this._window)
            return;
        if (typeof this._window.close_subpage === 'function')
            this._window.close_subpage();
        else if (fallbackPage)
            this._window.set_visible_page(fallbackPage);
    }

    _addProjectPage(window, data) {
        const page = new ProjectPage(data, () => {
            this._refreshList();
            this._refreshGroupList();
            this._scheduleAutoSave(window);
        }, () => this._closeEditorPage(this._projectsOverviewPage));
        if (typeof window.present_subpage !== 'function')
            window.add(page);
        this._projectPages.push(page);
        return page;
    }

    _addProject(window) {
        const newData = { name: 'New Project', path: '', icon: 'folder-symbolic', actions: [] };
        const page = this._addProjectPage(window, newData);
        this._refreshList();
        this._showEditorPage(page);
    }

    _removeProject(window, pageRef) {
        const idx = this._projectPages.indexOf(pageRef);
        if (idx === -1) return;
        this._projectPages.splice(idx, 1);
        if (typeof window.present_subpage !== 'function')
            window.remove(pageRef);
        this._refreshList();
        this._doSave(window);
    }

    _refreshList() {
        if (!this._projectsOverviewPage || !this._window)
            return;
        if (this._listGroup)
            this._projectsOverviewPage.remove(this._listGroup);
        this._listGroup = this._createProjectsListGroup(this._window);

        if (this._projectPages.length === 0) {
            const emptyRow = new Adw.ActionRow({
                title: 'No projects yet',
                subtitle: 'Click + to add your first project',
            });
            emptyRow.sensitive = false;
            this._listGroup.add(emptyRow);
            this._projectsOverviewPage.add(this._listGroup);
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
                this._showEditorPage(pageRef);
            });

            const deleteButton = new Gtk.Button({
                icon_name: 'user-trash-symbolic',
                valign: Gtk.Align.CENTER,
                css_classes: ['flat', 'error'],
                tooltip_text: 'Delete this project',
            });
            deleteButton.connect('clicked', () => {
                this._removeProject(this._window, pageRef);
            });
            row.add_suffix(deleteButton);

            this._listGroup.add(row);
        }

        this._projectsOverviewPage.add(this._listGroup);
    }

    // --- Groups ---

    _addGroupPage(window, data) {
        const page = new GroupEditorPage(data, this._getCurrentProjectsData(), () => {
            this._refreshGroupList();
            this._scheduleAutoSave(window);
        }, () => this._closeEditorPage(this._groupsOverviewPage));
        if (typeof window.present_subpage !== 'function')
            window.add(page);
        this._groupPages.push(page);
        return page;
    }

    _addGroup(window) {
        const newData = { name: 'New Group', icon: 'system-users-symbolic', action_refs: [] };
        const page = this._addGroupPage(window, newData);
        this._refreshGroupList();
        this._showEditorPage(page);
    }

    _removeGroup(window, pageRef) {
        const idx = this._groupPages.indexOf(pageRef);
        if (idx === -1) return;
        this._groupPages.splice(idx, 1);
        if (typeof window.present_subpage !== 'function')
            window.remove(pageRef);
        this._refreshGroupList();
        this._doSave(window);
    }

    _refreshGroupList() {
        if (!this._groupsOverviewPage || !this._window)
            return;
        if (this._groupsListGroup)
            this._groupsOverviewPage.remove(this._groupsListGroup);
        this._groupsListGroup = this._createGroupsListGroup(this._window);

        if (this._groupPages.length === 0) {
            const emptyRow = new Adw.ActionRow({
                title: 'No groups yet',
                subtitle: 'Click + to combine actions from different projects',
            });
            emptyRow.sensitive = false;
            this._groupsListGroup.add(emptyRow);
            this._groupsOverviewPage.add(this._groupsListGroup);
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
                this._showEditorPage(pageRef);
            });

            const deleteButton = new Gtk.Button({
                icon_name: 'user-trash-symbolic',
                valign: Gtk.Align.CENTER,
                css_classes: ['flat', 'error'],
                tooltip_text: 'Delete this group',
            });
            deleteButton.connect('clicked', () => {
                this._removeGroup(this._window, pageRef);
            });
            row.add_suffix(deleteButton);

            this._groupsListGroup.add(row);
        }

        this._groupsOverviewPage.add(this._groupsListGroup);
    }
}
