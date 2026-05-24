export function normalizeData(raw) {
    const defaultSettings = {
        auto_install_missing_tools: false,
    };

    if (Array.isArray(raw))
        return { projects: raw, groups: [], settings: defaultSettings };

    return {
        projects: raw.projects || [],
        groups: raw.groups || [],
        settings: { ...defaultSettings, ...(raw.settings || {}) },
    };
}
