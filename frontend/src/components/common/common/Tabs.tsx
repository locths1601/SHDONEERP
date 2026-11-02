import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Layers } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  showDropdown?: boolean;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  showDropdown = true,
}: TabsProps) {
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check whether the tabs container can scroll in either direction
  const checkScroll = useCallback(() => {
    if (!navRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
    // Allow 2px tolerance for fractional subpixel scaling
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  // Listen to resize and tab changes
  useEffect(() => {
    checkScroll();
    const nav = navRef.current;
    if (!nav) return;

    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => checkScroll());
      observer.observe(nav);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [checkScroll, tabs]);

  // Auto-scroll active tab into view when activeTab changes
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    const timer = setTimeout(checkScroll, 200);
    return () => clearTimeout(timer);
  }, [activeTab, checkScroll]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Scroll handler for arrow buttons
  const scroll = (direction: 'left' | 'right') => {
    if (!navRef.current) return;
    const scrollAmount = direction === 'left' ? -220 : 220;
    navRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 250);
  };

  // Allow standard mouse wheel to horizontally scroll tabs smoothly
  const handleWheel = (e: React.WheelEvent) => {
    if (navRef.current && (canScrollLeft || canScrollRight)) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        navRef.current.scrollLeft += e.deltaY;
        checkScroll();
      }
    }
  };

  return (
    <div className={`relative flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none ${className}`}>
      {/* Scrollable Tabs Wrapper */}
      <div className="relative flex-1 min-w-0 overflow-hidden">
        {/* Left Scroll Button & Soft Fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-1 pr-4 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 pointer-events-none">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="pointer-events-auto w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 hover:border-blue-400 dark:hover:border-sky-500 hover:shadow transition-all cursor-pointer"
              title="Cuộn sang trái"
              aria-label="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Items Container */}
        <nav
          ref={navRef}
          onScroll={checkScroll}
          onWheel={handleWheel}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 -mb-px overflow-x-auto scroll-smooth no-scrollbar"
          aria-label="Tabs"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => onChange(tab.id)}
                className={`
                  h-11 sm:h-12 flex items-center px-2.5 sm:px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer shrink-0 rounded-t-md group
                  ${
                    isActive
                      ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/40 dark:bg-indigo-950/20'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                  }
                `}
              >
                {tab.icon && (
                  <span
                    className={`mr-1.5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  >
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`
                      ml-1.5 px-2 py-0.5 text-[10px] sm:text-xs rounded-full font-medium shrink-0 transition-colors
                      ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Scroll Button & Soft Fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pr-1 pl-4 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 pointer-events-none">
            <button
              type="button"
              onClick={() => scroll('right')}
              className="pointer-events-auto w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 hover:border-blue-400 dark:hover:border-sky-500 hover:shadow transition-all cursor-pointer"
              title="Cuộn sang phải"
              aria-label="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Tab Switcher Dropdown */}
      {showDropdown && (
        <div ref={dropdownRef} className="relative shrink-0 px-2 py-1.5 border-l border-slate-200 dark:border-slate-800 flex items-center">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isDropdownOpen
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Danh sách tất cả tab"
            aria-expanded={isDropdownOpen}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline text-xs font-semibold">Tất cả tab</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-600 dark:text-slate-400 font-medium">
              {tabs.findIndex((t) => t.id === activeTab) + 1}/{tabs.length}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Popup */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Chọn tab dự án</span>
                <span className="font-mono text-[10px] text-slate-400">{tabs.length} tabs</span>
              </div>
              <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        onChange(tab.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50/90 text-indigo-700 font-semibold dark:bg-indigo-950/50 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {tab.icon && (
                          <span
                            className={`shrink-0 ${
                              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                            }`}
                          >
                            {tab.icon}
                          </span>
                        )}
                        <span className="truncate">{tab.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {tab.count !== undefined && (
                          <span
                            className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-medium ${
                              isActive
                                ? 'bg-indigo-200/60 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                        {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
