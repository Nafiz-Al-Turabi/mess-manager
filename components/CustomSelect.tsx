'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface CustomSelectProps {
  label?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: { target: { value: any; name?: string } }) => void;
  options?: (SelectOption | SelectGroup)[];
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  containerClassName?: string;
  className?: string;
  variant?: 'light' | 'dark' | 'glass';
  sizeVariant?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  searchable?: boolean;
}

function isGroup(item: SelectOption | SelectGroup): item is SelectGroup {
  return 'options' in item && Array.isArray((item as SelectGroup).options);
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  name,
  required = false,
  disabled = false,
  error,
  hint,
  containerClassName = '',
  className = '',
  variant = 'light',
  sizeVariant = 'md',
  icon,
  searchable,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | number>(
    value !== undefined ? value : defaultValue !== undefined ? defaultValue : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  // Keep internal state synced if controlled
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Flatten options for easy label lookup
  const allFlatOptions = React.useMemo(() => {
    const list: SelectOption[] = [];
    options.forEach((item) => {
      if (isGroup(item)) {
        list.push(...item.options);
      } else {
        list.push(item);
      }
    });
    return list;
  }, [options]);

  // Selected Option Object
  const selectedOption = allFlatOptions.find(
    (opt) => String(opt.value) === String(internalValue)
  );

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    setInternalValue(val);
    setIsOpen(false);
    if (onChange) {
      onChange({
        target: {
          value: val,
          name,
        },
      });
    }
  };

  // Filter options if searchable
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();

    return options
      .map((item) => {
        if (isGroup(item)) {
          const matched = item.options.filter((o) =>
            o.label.toLowerCase().includes(query)
          );
          return matched.length > 0 ? { ...item, options: matched } : null;
        } else {
          return item.label.toLowerCase().includes(query) ? item : null;
        }
      })
      .filter(Boolean) as (SelectOption | SelectGroup)[];
  }, [options, searchQuery]);

  // Enable search automatically if there are more than 6 options
  const shouldShowSearch =
    searchable !== undefined ? searchable : allFlatOptions.length > 6;

  // Style configurations
  const variantStyles = {
    light: {
      button:
        'bg-white text-slate-800 border-slate-200/90 shadow-2xs hover:border-[#438A53]/50 focus:border-[#438A53] focus:ring-4 focus:ring-[#438A53]/10',
      menu: 'bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl shadow-slate-900/10 text-slate-800',
      activeItem: 'bg-emerald-50 text-emerald-800 font-semibold',
      hoverItem: 'hover:bg-slate-50 text-slate-700',
      groupLabel: 'text-slate-400 font-bold bg-slate-50/80',
      search: 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400',
    },
    dark: {
      button:
        'bg-slate-900 text-slate-100 border-slate-700 shadow-2xs hover:border-emerald-500/60 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20',
      menu: 'bg-slate-900/95 backdrop-blur-xl border-slate-700 shadow-2xl text-slate-100',
      activeItem: 'bg-emerald-950/80 text-emerald-300 font-semibold',
      hoverItem: 'hover:bg-slate-800/80 text-slate-200',
      groupLabel: 'text-slate-400 font-bold bg-slate-800/60',
      search: 'bg-slate-800 border-slate-700 text-white placeholder-slate-400',
    },
    glass: {
      button:
        'bg-white/80 backdrop-blur-md text-slate-800 border-white/60 shadow-2xs hover:bg-white focus:border-[#438A53] focus:ring-4 focus:ring-[#438A53]/15',
      menu: 'bg-white/90 backdrop-blur-2xl border-white/60 shadow-2xl text-slate-800',
      activeItem: 'bg-emerald-50 text-emerald-800 font-semibold',
      hoverItem: 'hover:bg-emerald-50/50 text-slate-700',
      groupLabel: 'text-slate-400 font-bold bg-slate-100/50',
      search: 'bg-white/80 border-slate-200 text-slate-800 placeholder-slate-400',
    },
  }[variant];

  const sizeStyles = {
    sm: 'h-8 sm:h-9 text-xs px-2.5 rounded-lg gap-1.5',
    md: 'h-10 sm:h-10.5 text-xs sm:text-sm px-3 rounded-xl gap-2',
    lg: 'h-11 sm:h-12 text-sm sm:text-base px-3.5 rounded-xl gap-2.5 font-medium',
  }[sizeVariant];

  return (
    <div
      ref={dropdownRef}
      className={`w-full text-left relative select-none ${containerClassName}`}
    >
      {/* Hidden input to ensure HTML form submissions work */}
      <input
        type="hidden"
        name={name}
        value={internalValue}
        required={required}
      />

      {label && (
        <label
          htmlFor={id}
          className={`block text-xs font-semibold mb-1 tracking-tight ${
            variant === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          w-full flex items-center justify-between text-left transition-all duration-200 ease-out border outline-none
          ${sizeStyles}
          ${variantStyles.button}
          ${error ? '!border-rose-500 ring-2 ring-rose-500/20' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100/70' : 'cursor-pointer active:scale-[0.99]'}
          ${isOpen ? 'ring-4 ring-[#438A53]/15 border-[#438A53]' : ''}
          ${className}
        `}
      >
        <div className="flex items-center gap-2 truncate min-w-0 pr-1">
          {icon && (
            <span
              className={`shrink-0 ${
                variant === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {icon}
            </span>
          )}
          <span
            className={`truncate font-medium ${
              selectedOption
                ? ''
                : variant === 'dark'
                ? 'text-slate-500'
                : 'text-slate-400'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180 text-[#438A53]' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Floating Animated Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          className={`
            absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border overflow-hidden p-1.5
            animate-in fade-in zoom-in-95 duration-150 origin-top
            ${variantStyles.menu}
          `}
        >
          {/* Search bar inside dropdown (especially awesome for mobile / long lists) */}
          {shouldShowSearch && (
            <div className="p-1 pb-1.5 relative border-b border-slate-100/60 dark:border-slate-800/80 mb-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border outline-none transition ${variantStyles.search}`}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 sm:max-h-64 overflow-y-auto overscroll-contain space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                কোনো অপশন পাওয়া যায়নি
              </div>
            ) : (
              filteredOptions.map((item, idx) => {
                if (isGroup(item)) {
                  return (
                    <div key={idx} className="pt-1.5 first:pt-0">
                      <div
                        className={`px-2.5 py-1 text-[10px] tracking-wider uppercase rounded-md mb-0.5 ${variantStyles.groupLabel}`}
                      >
                        {item.label}
                      </div>
                      <div className="space-y-0.5 pl-1">
                        {item.options.map((opt) => {
                          const isSelected =
                            String(opt.value) === String(internalValue);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={opt.disabled}
                              onClick={() => handleSelect(opt.value)}
                              className={`
                                w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition text-left
                                ${
                                  isSelected
                                    ? variantStyles.activeItem
                                    : variantStyles.hoverItem
                                }
                                ${
                                  opt.disabled
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'cursor-pointer active:scale-[0.99]'
                                }
                              `}
                            >
                              <span className="truncate pr-2">{opt.label}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const isSelected =
                  String(item.value) === String(internalValue);
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => handleSelect(item.value)}
                    className={`
                      w-full flex items-center justify-between px-2.5 py-2 text-xs sm:text-sm rounded-xl transition text-left
                      ${
                        isSelected
                          ? variantStyles.activeItem
                          : variantStyles.hoverItem
                      }
                      ${
                        item.disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'cursor-pointer active:scale-[0.99]'
                      }
                    `}
                  >
                    <span className="truncate pr-2 font-normal">
                      {item.label}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-[11px] text-rose-500 font-medium animate-in fade-in">
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          className={`mt-1 text-[11px] ${
            variant === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};
