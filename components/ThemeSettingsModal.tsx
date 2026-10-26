'use client';

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  X,
  Eye,
  Utensils,
  Wand2,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '@/lib/types';
import {
  DEFAULT_THEME_COLORS,
  THEME_PRESETS,
  ThemeColors,
  adjustHexBrightness,
  applyTheme,
  loadStoredTheme,
  resetToDefaultTheme,
  saveTheme,
} from '@/lib/theme';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onThemeSaved?: (presetId: string, colors: ThemeColors) => void;
}

// Curated seeds for 1-click custom palette generation
const QUICK_COLOR_SEEDS: Array<{
  nameBn: string;
  nameEn: string;
  colors: ThemeColors;
}> = [
  {
    nameBn: 'লাক্সারি এমারেল্ড',
    nameEn: 'Luxe Emerald',
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
    nameBn: 'ডিপ স্যাফায়ার',
    nameEn: 'Deep Sapphire',
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
    nameBn: 'অরোরা ভায়োলেট',
    nameEn: 'Aurora Violet',
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
    nameBn: 'ভেলভেট বোর্দো',
    nameEn: 'Velvet Bordeaux',
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
    nameBn: 'রিচ মোকা কফি',
    nameEn: 'Rich Mocha',
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
    nameBn: 'সাইবার ওবসিডিয়ান',
    nameEn: 'Cyber Obsidian',
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
    nameBn: 'সানসেট কোরাল',
    nameEn: 'Sunset Coral',
    colors: {
      primary: '#29150F',
      subDark: '#1C0D08',
      accent: '#EA580C',
      highlight: '#FBBF24',
      lime: '#F97316',
      bg: '#FFF7ED',
    },
  },
  {
    nameBn: 'ক্লাসিক পাইন',
    nameEn: 'Classic Pine',
    colors: DEFAULT_THEME_COLORS,
  },
];

export function ThemeSettingsModal({
  isOpen,
  onClose,
  lang,
  onThemeSaved,
}: ThemeSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pine-forest');
  const [customColors, setCustomColors] = useState<ThemeColors>(DEFAULT_THEME_COLORS);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Load active theme when modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = loadStoredTheme();
      setSelectedPresetId(stored.presetId);
      setCustomColors(stored.colors);
      if (stored.presetId === 'custom') {
        setActiveTab('custom');
      } else {
        setActiveTab('presets');
      }
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Current preview colors
  const activePreviewColors: ThemeColors =
    activeTab === 'presets'
      ? THEME_PRESETS.find((p) => p.id === selectedPresetId)?.colors || DEFAULT_THEME_COLORS
      : customColors;

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCustomColors(preset.colors);
      applyTheme(preset.colors);
    }
  };

  const handleCustomColorChange = (key: keyof ThemeColors, value: string) => {
    const updated: ThemeColors = {
      ...customColors,
      [key]: value,
    };
    if (key === 'primary') {
      updated.subDark = adjustHexBrightness(value, -15);
    }
    setCustomColors(updated);
    setSelectedPresetId('custom');
    applyTheme(updated);
  };

  const handleApplySeed = (seedColors: ThemeColors) => {
    setCustomColors(seedColors);
    setSelectedPresetId('custom');
    applyTheme(seedColors);
  };

  const handleSave = () => {
    saveTheme(selectedPresetId, customColors);
    onThemeSaved?.(selectedPresetId, activePreviewColors);
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
      onClose();
    }, 700);
  };

  const handleReset = () => {
    resetToDefaultTheme();
    setSelectedPresetId('pine-forest');
    setCustomColors(DEFAULT_THEME_COLORS);
    applyTheme(DEFAULT_THEME_COLORS);
    onThemeSaved?.('pine-forest', DEFAULT_THEME_COLORS);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#173125]/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-[#173125] text-white p-5 flex items-center justify-between gap-4 border-b border-[#438A53]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#438A53]/40 border border-[#FED24F]/30 flex items-center justify-center text-[#FED24F] shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  {lang === 'bn' ? 'সাইট থিম ও আকর্ষণীয় রঙ সেটিংস' : 'Theme & Color Palette Studio'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FED24F]/20 text-[#FED24F] font-bold text-[10px] border border-[#FED24F]/30">
                  Admin
                </span>
              </div>
              <p className="text-xs text-white/75 mt-0.5">
                {lang === 'bn'
                  ? 'আপনার মেসের জন্য সুন্দর ও প্রফেশনাল থিম নির্বাচন বা কাস্টমাইজ করুন'
                  : 'Select curated designer palettes or craft custom brand colors for your mess'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LIVE REAL-TIME PREVIEW BANNER */}
        <div className="p-4 bg-slate-100/90 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <Eye className="w-3.5 h-3.5 text-[#438A53]" />
              {lang === 'bn' ? 'লাইভ প্রিভিউ (রিয়েল-টাইম লুক)' : 'Live Preview'}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              {lang === 'bn' ? 'ক্লিক করলেই সাথে সাথে পরিবর্তন দেখা যাবে' : 'Instant real-time update'}
            </span>
          </div>

          {/* Mini Mock Dashboard Banner */}
          <div
            className="rounded-2xl p-4 border transition-all duration-300 shadow-md relative overflow-hidden"
            style={{
              backgroundColor: activePreviewColors.primary,
              borderColor: activePreviewColors.accent,
            }}
          >
            {/* Top Bar Mock */}
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shadow-xs"
                  style={{
                    backgroundColor: activePreviewColors.accent,
                    color: activePreviewColors.highlight,
                  }}
                >
                  <Utensils className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">মেস হিসাব (Mess Manager)</p>
                  <p className="text-[10px] text-white/70">রিয়েল-টাইম ক্লাউড সিঙ্ক</p>
                </div>
              </div>
              <div
                className="text-xs font-bold font-numeric px-3 py-1 rounded-xl shadow-xs"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: activePreviewColors.highlight,
                  border: `1px solid rgba(255, 255, 255, 0.18)`,
                }}
              >
                মিল রেট: ৳৪৮.৫০
              </div>
            </div>

            {/* Bottom Row Mock */}
            <div className="flex flex-wrap items-center justify-between pt-3 gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20"
                  style={{ backgroundColor: activePreviewColors.lime }}
                />
                <span className="text-xs text-white/90 font-medium">১২ জন সক্রিয় মেম্বার</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  style={{
                    backgroundColor: activePreviewColors.highlight,
                    color: activePreviewColors.primary,
                  }}
                >
                  মিল এন্ট্রি করুন
                </div>
                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs cursor-pointer"
                  style={{
                    backgroundColor: activePreviewColors.accent,
                  }}
                >
                  পিডিএফ রিপোর্ট
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB SELECTOR */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-[#173125] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FED24F]" />
            <span>{lang === 'bn' ? 'রেডিমেড সুন্দর প্রিসেট (৮টি)' : 'Curated Palettes (8)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#173125] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#FED24F]" />
            <span>{lang === 'bn' ? 'কাস্টম কালার পিকার' : 'Custom Palette Builder'}</span>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: CURATED PRESETS */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative group overflow-hidden ${
                      isSelected
                        ? 'border-[#438A53] ring-2 ring-[#438A53]/35 bg-emerald-50/40 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white shadow-xs'
                    }`}
                  >
                    {/* Header: Emoji, Name & Tag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{preset.emoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-[#173125]">
                              {lang === 'bn' ? preset.nameBn : preset.nameEn}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {lang === 'bn' ? preset.descriptionBn : preset.descriptionEn}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {lang === 'bn' ? preset.tagBn : preset.tagEn}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#438A53] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Color Swatch Strip & Hex Bar */}
                    <div className="space-y-1.5 pt-1">
                      {/* 4-Color Gradient Preview Bar */}
                      <div className="h-2 w-full rounded-full overflow-hidden flex shadow-inner border border-black/5">
                        <div className="flex-1" style={{ backgroundColor: preset.colors.primary }} />
                        <div className="flex-1" style={{ backgroundColor: preset.colors.accent }} />
                        <div className="flex-1" style={{ backgroundColor: preset.colors.highlight }} />
                        <div className="flex-1" style={{ backgroundColor: preset.colors.bg }} />
                      </div>

                      {/* Swatch circles with labels */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-numeric pt-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: preset.colors.primary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: preset.colors.accent }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: preset.colors.highlight }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: preset.colors.bg }}
                          />
                        </div>
                        <span>{preset.colors.primary}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: CUSTOM COLOR PICKER */}
          {activeTab === 'custom' && (
            <div className="space-y-5">
              {/* 1-Click Aesthetic Seeds */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#173125] mb-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-[#438A53]" />
                  <span>{lang === 'bn' ? '১-ক্লিকে সুন্দর কালার প্যালেট নির্বাচন করুন' : '1-Click Aesthetic Color Seeds'}</span>
                </div>
                <p className="text-[11px] text-slate-600 mb-3">
                  {lang === 'bn'
                    ? 'যেকোনো একটি শেডে ক্লিক করলে স্বয়ংক্রিয়ভাবে ৪টি রঙ সুন্দরভাবে সাজিয়ে দেবে:'
                    : 'Click any seed to instantly generate 4 harmonized colors:'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {QUICK_COLOR_SEEDS.map((seed) => (
                    <button
                      key={seed.nameEn}
                      type="button"
                      onClick={() => handleApplySeed(seed.colors)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <div className="flex items-center -space-x-1">
                        <span
                          className="w-3 h-3 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: seed.colors.primary }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: seed.colors.accent }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: seed.colors.highlight }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#173125]">
                        {lang === 'bn' ? seed.nameBn : seed.nameEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Color Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Primary Dark */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#173125]">
                      {lang === 'bn' ? '১. প্রাইমারি ডার্ক (Primary Dark)' : '1. Primary Dark'}
                    </label>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: customColors.primary }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    {lang === 'bn' ? 'হেডার বার, হিরো কার্ড ও প্রধান বাটন' : 'Header, hero cards, dark buttons'}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={customColors.primary}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0 shadow-xs"
                    />
                    <input
                      type="text"
                      value={customColors.primary}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-numeric font-bold uppercase bg-white focus:ring-2 focus:ring-[#438A53]/20 focus:border-[#438A53] outline-none"
                    />
                  </div>
                </div>

                {/* 2. Accent Color */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#173125]">
                      {lang === 'bn' ? '২. অ্যাকসেন্ট কালার (Accent Color)' : '2. Accent Color'}
                    </label>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: customColors.accent }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    {lang === 'bn' ? 'সেকেন্ডারি বাটন, বর্ডার ও হাইলাইটেড কার্ড' : 'Action buttons, card borders & badges'}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={customColors.accent}
                      onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0 shadow-xs"
                    />
                    <input
                      type="text"
                      value={customColors.accent}
                      onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-numeric font-bold uppercase bg-white focus:ring-2 focus:ring-[#438A53]/20 focus:border-[#438A53] outline-none"
                    />
                  </div>
                </div>

                {/* 3. Highlight / Gold */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#173125]">
                      {lang === 'bn' ? '৩. হাইলাইট / গোল্ড (Highlight Gold)' : '3. Highlight Gold'}
                    </label>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: customColors.highlight }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    {lang === 'bn' ? 'মিল রেট, টাকার হিসাব ও নোটিশ ব্যাজ' : 'Meal rate, metrics & notice badge'}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={customColors.highlight}
                      onChange={(e) => handleCustomColorChange('highlight', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0 shadow-xs"
                    />
                    <input
                      type="text"
                      value={customColors.highlight}
                      onChange={(e) => handleCustomColorChange('highlight', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-numeric font-bold uppercase bg-white focus:ring-2 focus:ring-[#438A53]/20 focus:border-[#438A53] outline-none"
                    />
                  </div>
                </div>

                {/* 4. Background */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#173125]">
                      {lang === 'bn' ? '৪. ব্যাকগ্রাউন্ড টোন (Background Tint)' : '4. Background Tint'}
                    </label>
                    <span
                      className="w-3 h-3 rounded-full border border-slate-200"
                      style={{ backgroundColor: customColors.bg }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    {lang === 'bn' ? 'পুরো পেজের ব্যাকগ্রাউন্ড কালার' : 'Main page background surface'}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={customColors.bg}
                      onChange={(e) => handleCustomColorChange('bg', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0 shadow-xs"
                    />
                    <input
                      type="text"
                      value={customColors.bg}
                      onChange={(e) => handleCustomColorChange('bg', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-numeric font-bold uppercase bg-white focus:ring-2 focus:ring-[#438A53]/20 focus:border-[#438A53] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ডিফল্ট থিমে ফিরুন' : 'Reset to Default'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#173125] hover:bg-[#204232] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              {isSavedFeedback ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#FED24F]" />
                  <span>{lang === 'bn' ? 'থিম সেভ হয়েছে!' : 'Theme Saved!'}</span>
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4 text-[#FED24F]" />
                  <span>{lang === 'bn' ? 'থিম সেভ ও প্রয়োগ করুন' : 'Save & Apply'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
