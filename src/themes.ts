/** All supported visual themes */
export type ThemeId = 'win98' | 'winxp' | 'win7' | 'macos';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  /** Streak count that unlocks this theme */
  unlockStreak: number;
  /** Short flavour text shown in the reward dialog */
  tagline: string;
  /** Background colour for the reward dialog preview */
  previewBg: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'win98',
    name: 'Windows 98',
    unlockStreak: 0,
    tagline: 'The classic.',
    previewBg: '#008080',
  },
  {
    id: 'winxp',
    name: 'Windows XP',
    unlockStreak: 3,
    tagline: 'Welcome to the 21st century!',
    previewBg: '#235bce',
  },
  {
    id: 'win7',
    name: 'Windows 7',
    unlockStreak: 5,
    tagline: 'Aero glass — feel the breeze.',
    previewBg: '#1f4e99',
  },
  {
    id: 'macos',
    name: 'Classic Mac OS',
    unlockStreak: 10,
    tagline: 'Think different.',
    previewBg: '#6e6e6e',
  },
];

/** Streak thresholds that trigger a theme reward (ascending) */
export const THEME_THRESHOLDS = THEMES.filter((t) => t.unlockStreak > 0).map(
  (t) => t.unlockStreak,
);

export const LS_THEME_KEY = 'plusgame_theme';
export const LS_MAX_THEME_KEY = 'plusgame_max_theme';

export function loadSavedThemeId(): ThemeId {
  try {
    const val = localStorage.getItem(LS_THEME_KEY) as ThemeId | null;
    if (val && THEMES.some((t) => t.id === val)) return val;
  } catch {
    // ignore
  }
  return 'win98';
}

export function saveThemeId(id: ThemeId): void {
  try {
    localStorage.setItem(LS_THEME_KEY, id);
  } catch {
    // ignore
  }
}

export function loadMaxThemeId(): ThemeId {
  try {
    const val = localStorage.getItem(LS_MAX_THEME_KEY) as ThemeId | null;
    if (val && THEMES.some((t) => t.id === val)) return val;
  } catch {
    // ignore
  }
  return 'win98';
}

export function saveMaxThemeId(id: ThemeId): void {
  try {
    localStorage.setItem(LS_MAX_THEME_KEY, id);
  } catch {
    // ignore
  }
}

/** Return the theme unlocked at a given streak, or null */
export function getThemeForStreak(streak: number): ThemeDefinition | null {
  return (
    THEMES.slice()
      .reverse()
      .find((t) => t.unlockStreak > 0 && streak === t.unlockStreak) ?? null
  );
}
