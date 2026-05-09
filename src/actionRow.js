import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';

import { StepRow } from './stepRow.js';

export const ActionRow = GObject.registerClass({
    Properties: {
        'action-label': GObject.ParamSpec.string('action-label', '', '', GObject.ParamFlags.READWRITE, ''),
        'action-icon': GObject.ParamSpec.string('action-icon', '', '', GObject.ParamFlags.READWRITE, ''),
    },
}, class ActionRow extends Adw.ExpanderRow {
    _init(data = {}, onChanged, onDelete) {
        super._init({
            title: data.label || 'New Action',
            subtitle: 'Expand to edit steps',
        });

        this._onChanged = onChanged;
        this._onDelete = onDelete;

        this.actionData = {
            label: data.label || '',
            icon: data.icon || '',
            steps: data.steps ? data.steps.map(s => ({ ...s })) : [],
        };

        this._stepRows = [];

        const labelEntry = new Adw.EntryRow({
            title: 'Action Label',
            text: this.actionData.label,
        });
        labelEntry.connect('changed', () => {
            this.actionData.label = labelEntry.text;
            this.title = labelEntry.text || 'New Action';
            this._onChanged?.();
        });
        this.add_row(labelEntry);

        const iconEntry = new Adw.EntryRow({
            title: 'Icon Name (freedesktop.org)',
            text: this.actionData.icon,
        });
        iconEntry.connect('changed', () => {
            this.actionData.icon = iconEntry.text;
            this._onChanged?.();
        });
        this.add_row(iconEntry);

        const stepsHeader = new Adw.ActionRow({
            title: 'Commands (Steps)',
            subtitle: 'Each step runs when this action is triggered. Toggle "Terminal" to run in a terminal.',
        });
        const addStepButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
            tooltip_text: 'Add a step',
        });
        addStepButton.connect('clicked', () => this._addStep());
        stepsHeader.add_suffix(addStepButton);
        this.add_row(stepsHeader);

        for (const step of this.actionData.steps)
            this._addStep(step);

        const deleteButton = new Gtk.Button({
            icon_name: 'user-trash-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat', 'error'],
            tooltip_text: 'Delete this action',
        });
        deleteButton.connect('clicked', () => {
            this._onChanged?.();
            this._onDelete?.();
            const group = this.get_parent();
            if (group)
                group.remove(this);
        });
        this.add_suffix(deleteButton);
    }

    _addStep(data = {}) {
        const row = new StepRow(data, this._onChanged, () => {
            const idx = this._stepRows.indexOf(row);
            if (idx !== -1)
                this._stepRows.splice(idx, 1);
        });
        this._stepRows.push(row);
        this.add_row(row);
    }

    getActionData() {
        const steps = this._stepRows.map(r => ({ ...r.stepData }));
        return { ...this.actionData, steps };
    }
});
