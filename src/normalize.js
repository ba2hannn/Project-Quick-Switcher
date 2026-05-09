export function normalizeData(raw) {
    if (Array.isArray(raw))
        return { projects: raw, groups: [] };
    return { projects: raw.projects || [], groups: raw.groups || [] };
}
