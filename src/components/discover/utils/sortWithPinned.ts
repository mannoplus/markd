export const PINNED_COUNTRIES = ['US', 'TW', 'GB', 'JP', 'CN', 'KR', 'FR', 'DE'];

export function sortWithPinned<T extends { iso_3166_1: string; english_name: string }>(
    countries: T[]
): T[] {
    const pinnedSet = new Set(PINNED_COUNTRIES);
    const pinned: T[] = [];
    const rest: T[] = [];

    for (const c of countries) {
        if (pinnedSet.has(c.iso_3166_1)) {
            pinned.push(c);
        } else {
            rest.push(c);
        }
    }

    // Sort pinned in the exact order of PINNED_COUNTRIES
    pinned.sort((a, b) => {
        return PINNED_COUNTRIES.indexOf(a.iso_3166_1) - PINNED_COUNTRIES.indexOf(b.iso_3166_1);
    });

    // Sort the rest alphabetically
    rest.sort((a, b) => a.english_name.localeCompare(b.english_name));

    return [...pinned, ...rest];
}
