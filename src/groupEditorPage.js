import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';

export const GroupEditorPage = GObject.registerClass(
class GroupEditorPage extends Adw.PreferencesPage {
    _init(groupData = {}, projectsData, onSave) {
        super._init({
            title: groupData.name || 'New Group',
            icon_name: groupData.icon || 'system-users-symbolic',
        });

        this._onSave = onSave;
        this._checkButtons = [];

        this.groupData = {
            name: groupData.name || '',
            icon: groupData.icon || 'system-users-symbolic',
            workspace: groupData.workspace || 'current',
        };

        const existingRefs = (groupData.action_refs || []).map(
            r => `${r.project}::${r.action_label}`
        );

        const infoGroup = new Adw.PreferencesGroup({
            title: 'Group Info',
        });

        const nameRow = new Adw.EntryRow({
            title: 'Group Name',
            text: this.groupData.name,
        });
        nameRow.connect('changed', () => {
            this.groupData.name = nameRow.text;
            this.title = nameRow.text || 'New Group';
            this._onSave?.();
        });
        infoGroup.add(nameRow);

        const iconRow = new Adw.EntryRow({
            title: 'Icon Name',
            text: this.groupData.icon,
        });
        iconRow.connect('changed', () => {
            this.groupData.icon = iconRow.text || 'system-users-symbolic';
            this.icon_name = this.groupData.icon;
            this._onSave?.();
        });
        infoGroup.add(iconRow);

        const wsRow = new Adw.ComboRow({
            title: 'Workspace',
            subtitle: 'Run this group on a specific workspace',
            model: new Gtk.StringList({
                strings: [
                    'Current',
                    'New Workspace',
                    'Workspace 1',
                    'Workspace 2',
                    'Workspace 3',
                    'Workspace 4',
                    'Workspace 5',
                    'Workspace 6',
                ],
            }),
        });
        const wsMap = ['current', 'new', 1, 2, 3, 4, 5, 6];
        const savedWs = this.groupData.workspace;
        if (savedWs === 'current' || !savedWs)
            wsRow.set_selected(0);
        else if (savedWs === 'new')
            wsRow.set_selected(1);
        else
            wsRow.set_selected(wsMap.indexOf(savedWs) !== -1 ? wsMap.indexOf(savedWs) : 0);
        wsRow.connect('notify::selected', () => {
            this.groupData.workspace = wsMap[wsRow.get_selected()];
            this._onSave?.();
        });
        infoGroup.add(wsRow);

        this.add(infoGroup);

        const actionsGroup = new Adw.PreferencesGroup({
            title: 'Select Actions',
            description: 'Choose actions from your projects to run together.',
        });

        if (projectsData.length === 0) {
            const emptyRow = new Adw.ActionRow({
                title: 'No projects available',
                subtitle: 'Add projects first, then create groups.',
            });
            emptyRow.sensitive = false;
            actionsGroup.add(emptyRow);
        }

        for (const project of projectsData) {
            const actions = project.actions || [];
            if (actions.length === 0)
                continue;

            const expander = new Adw.ExpanderRow({
                title: project.name || 'Unnamed',
                subtitle: project.path || '',
            });
            expander.add_prefix(new Gtk.Image({
                icon_name: project.icon || 'folder-symbolic',
                valign: Gtk.Align.CENTER,
            }));

            for (const action of actions) {
                const label = action.label || 'Unnamed Action';
                const key = `${project.name}::${label}`;
                const isChecked = existingRefs.includes(key);

                const checkRow = new Adw.ActionRow({
                    title: label,
                });
                checkRow.add_prefix(new Gtk.Image({
                    icon_name: action.icon || 'system-run-symbolic',
                    valign: Gtk.Align.CENTER,
                }));

                const check = new Gtk.CheckButton({
                    valign: Gtk.Align.CENTER,
                    active: isChecked,
                });
                check.connect('notify::active', () => this._onSave?.());
                checkRow.add_suffix(check);

                this._checkButtons.push({
                    check,
                    project: project.name,
                    actionLabel: label,
                });

                expander.add_row(checkRow);
            }

            actionsGroup.add(expander);
        }

        this.add(actionsGroup);
    }

    getGroupData() {
        const action_refs = [];
        for (const cb of this._checkButtons) {
            if (cb.check.active)
                action_refs.push({ project: cb.project, action_label: cb.actionLabel });
        }
        return { ...this.groupData, action_refs };
    }
});
