export interface ThemeColors {
  primary: string;    // Main dark shade (Header, Hero card, Dark buttons, Headings)
  subDark: string;    // Sub bar, darker contrast sections
  accent: string;     // Primary Accent (Borders, Action buttons, Highlights)
  highlight: string;  // Gold/Lustrous Accent (Numbers, Badges, Attention)
  lime: string;       // Secondary highlight / Positive badges
  bg: string;         // Body and card backgrounds
}

export interface ThemePreset {
  id: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  descriptionEn: string;
  tagBn: string;
  tagEn: string;
  emoji: string;
  colors: ThemeColors;
}

export const DEFAULT_THEME_COLORS: ThemeColors = {
  primary: '#173125',
  subDark: '#11251C',
  accent: '#2E7D46',
  highlight: '#FED24F',
  lime: '#52B788',
  bg: '#F6F8F5',
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'pine-forest',
    nameBn: 'চিরহরিৎ পাইন ও সান গোল্ড',
    nameEn: 'Pine Forest & Sun Gold',
    descriptionBn: 'মেস হিসাবের ক্লাসিক ও প্রাকৃতিক সবুজ থিম',
    descriptionEn: 'Classic evergreen pine with warm sun gold',
    tagBn: 'ডিফল্ট',
    tagEn: 'Default',
    emoji: '🌿',
    colors: DEFAULT_THEME_COLORS,
  },
  {
    id: 'luxe-emerald',
    nameBn: 'রয়্যাল এমারেল্ড ও লাক্সারি গোল্ড',
    nameEn: 'Royal Emerald & Pure Gold',
    descriptionBn: 'অভিজাত গাঢ় ব্রিটিশ এমারেল্ড ও খাঁটি সোনালী আভা',
    descriptionEn: 'Deep British racing green with vibrant 24k gold',
    tagBn: 'লাক্সারি',
    tagEn: 'Luxury',
    emoji: '💎',
    colors: {
      primary: '#062E20',
      subDark: '#031E15',
      accent: '#10B981',
      highlight: '#F59E0B',
      lime: '#34D399',
      bg: '#F0FDF4',
    },
  },
  {
    id: 'midnight-sapphire',
    nameBn: 'মিডনাইট স্যাফায়ার ও স্কাই সায়ান',
    nameEn: 'Midnight Sapphire & Sky Cyan',
    descriptionBn: 'শান্ত, আধুনিক ও প্রফেশনাল ডিপ নেভি ব্লু',
    descriptionEn: 'Serene midnight navy with electric sky cyan',
    tagBn: 'প্রফেশনাল',
    tagEn: 'Professional',
    emoji: '🌊',
    colors: {
      primary: '#0B132B',
      subDark: '#070C1B',
      accent: '#2563EB',
      highlight: '#38BDF8',
      lime: '#60A5FA',
      bg: '#F0F4F8',
    },
  },
  {
    id: 'aurora-violet',
    nameBn: 'অরোরা ভায়োলেট ও অ্যাম্বার গোল্ড',
    nameEn: 'Aurora Violet & Honey Amber',
    descriptionBn: 'রাজকীয় মখমল বেগুনি ও উজ্জ্বল অ্যাম্বার গোল্ড',
    descriptionEn: 'Regal velvet violet with glowing honey gold',
    tagBn: 'রয়্যাল',
    tagEn: 'Royal',
    emoji: '🔮',
    colors: {
      primary: '#1E1035',
      subDark: '#140A24',
      accent: '#7C3AED',
      highlight: '#FBBF24',
      lime: '#A78BFA',
      bg: '#FAF5FF',
    },
  },
  {
    id: 'velvet-bordeaux',
    nameBn: 'ভেলভেট বোর্দো ও ক্রিমসন রোজ',
    nameEn: 'Velvet Bordeaux & Crimson Rose',
    descriptionBn: 'গভীর ফ্রেঞ্চ ওয়াইন বার্গান্ডি ও উষ্ণ গোল্ডেন আভা',
    descriptionEn: 'Deep French wine crimson with warm rose gold',
    tagBn: 'এলিগেন্ট',
    tagEn: 'Elegant',
    emoji: '🍷',
    colors: {
      primary: '#2D0B16',
      subDark: '#1E060E',
      accent: '#BE123C',
      highlight: '#F59E0B',
      lime: '#FB7185',
      bg: '#FDF6F7',
    },
  },
  {
    id: 'espresso-mocha',
    nameBn: 'রিচ মোকা ও ডালচে ক্যারামেল',
    nameEn: 'Rich Mocha & Dulce Caramel',
    descriptionBn: 'উষ্ণ রোস্টেড কফি, তামা ও ক্যারামেল অ্যাম্বার',
    descriptionEn: 'Roasted coffee espresso with caramel amber toffee',
    tagBn: 'ওয়ার্ম',
    tagEn: 'Warm',
    emoji: '☕',
    colors: {
      primary: '#1C130E',
      subDark: '#120B07',
      accent: '#9A5B32',
      highlight: '#F59E0B',
      lime: '#B45309',
      bg: '#FAF7F2',
    },
  },
  {
    id: 'cyber-obsidian',
    nameBn: 'সাইবার ওবসিডিয়ান ও নিওন মিন্ট',
    nameEn: 'Cyber Obsidian & Neon Mint',
    descriptionBn: 'মডার্ন মিনিমালিস্টিক ডার্ক টাইটানিয়াম ও ইলেকট্রিক মিন্ট',
    descriptionEn: 'Minimalist obsidian dark with electric mint neon',
    tagBn: 'মডার্ন',
    tagEn: 'Modern',
    emoji: '🖤',
    colors: {
      primary: '#0F172A',
      subDark: '#0A0F1D',
      accent: '#0D9488',
      highlight: '#10B981',
      lime: '#2DD4BF',
      bg: '#F8FAFC',
    },
  },
  {
    id: 'sunset-terracotta',
    nameBn: 'সানসেট কোরাল ও গোল্ডেন আওয়ার',
    nameEn: 'Sunset Coral & Golden Hour',
    descriptionBn: 'উষ্ণ সানসেট টেরা কোটা ও সোনালী রোদের আভা',
    descriptionEn: 'Warm sunset coral bronze with golden sunlight',
    tagBn: 'ভাইব্রেন্ট',
    tagEn: 'Vibrant',
    emoji: '🌅',
    colors: {
      primary: '#29150F',
      subDark: '#1C0D08',
      accent: '#EA580C',
      highlight: '#FBBF24',
      lime: '#F97316',
      bg: '#FFF7ED',
    },
  },
];

const STORAGE_KEY = 'mess_site_theme_v1';

/**
 * Helper to adjust a hex color brightness/shade
 */
export function adjustHexBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Apply the theme colors dynamically to document root CSS variables
 */
export function applyTheme(colors: ThemeColors): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--theme-primary', colors.primary);
  root.style.setProperty('--theme-sub-dark', colors.subDark || adjustHexBrightness(colors.primary, -15));
  root.style.setProperty('--theme-accent', colors.accent);
  root.style.setProperty('--theme-gold', colors.highlight);
  root.style.setProperty('--theme-lime', colors.lime || colors.accent);
  root.style.setProperty('--theme-bg', colors.bg);

  // Set active attribute
  root.setAttribute('data-custom-theme', 'true');
}

/**
 * Remove custom theme and reset to default
 */
export function resetToDefaultTheme(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.removeAttribute('data-custom-theme');
  root.style.removeProperty('--theme-primary');
  root.style.removeProperty('--theme-sub-dark');
  root.style.removeProperty('--theme-accent');
  root.style.removeProperty('--theme-gold');
  root.style.removeProperty('--theme-lime');
  root.style.removeProperty('--theme-bg');

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Could not remove theme from localStorage:', err);
  }
}

/**
 * Save theme to localStorage and apply
 */
export function saveTheme(presetId: string, customColors?: ThemeColors): void {
  let colorsToApply: ThemeColors;
  if (presetId === 'custom' && customColors) {
    colorsToApply = customColors;
  } else {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    colorsToApply = found ? found.colors : DEFAULT_THEME_COLORS;
  }

  applyTheme(colorsToApply);

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        presetId,
        colors: colorsToApply,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('Could not save theme to localStorage:', err);
  }
}

/**
 * Load stored theme from localStorage
 */
export function loadStoredTheme(): { presetId: string; colors: ThemeColors } {
  if (typeof window === 'undefined') {
    return { presetId: 'pine-forest', colors: DEFAULT_THEME_COLORS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { presetId: 'pine-forest', colors: DEFAULT_THEME_COLORS };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.colors) {
      return {
        presetId: parsed.presetId || 'custom',
        colors: parsed.colors,
      };
    }
  } catch (err) {
    console.warn('Error reading theme from localStorage:', err);
  }
  return { presetId: 'pine-forest', colors: DEFAULT_THEME_COLORS };
}
