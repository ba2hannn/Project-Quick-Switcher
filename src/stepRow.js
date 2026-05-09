import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';

export const StepRow = GObject.registerClass(
class StepRow extends Adw.ActionRow {
    _init(data = {}, onChanged, onDelete) {
        super._init({
            title: data.command || 'New Step',
            activatable: false,
        });

        this._onChanged = onChanged;
        this._onDelete = onDelete;

        this.stepData = {
            command: data.command || '',
            terminal: data.terminal || false,
        };

        const commandBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 8,
        });

        const commandEntry = new Gtk.Entry({
            hexpand: true,
            placeholder_text: 'e.g. code . or npm install',
            text: this.stepData.command,
        });
        commandEntry.connect('changed', () => {
            this.stepData.command = commandEntry.text;
            this.title = commandEntry.text || 'New Step';
            this._onChanged?.();
        });
        commandBox.append(commandEntry);

        const termSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this.stepData.terminal,
            tooltip_text: 'Run in Terminal',
        });
        termSwitch.connect('notify::active', () => {
            this.stepData.terminal = termSwitch.active;
            this._onChanged?.();
        });
        commandBox.append(termSwitch);

        const termLabel = new Gtk.Label({
            label: 'Terminal',
            tooltip_text: 'Runs in a terminal that stays open',
        });
        commandBox.append(termLabel);

        const deleteButton = new Gtk.Button({
            icon_name: 'user-trash-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat', 'error'],
            tooltip_text: 'Remove this step',
        });
        deleteButton.connect('clicked', () => {
            this._onChanged?.();
            this._onDelete?.();
            const group = this.get_parent();
            if (group)
                group.remove(this);
        });
        commandBox.append(deleteButton);

        this.set_child(commandBox);
    }
});
