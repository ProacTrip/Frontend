'use client';

interface ResultTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function ResultTabs({ tabs, activeTab, onTabChange }: ResultTabsProps) {
  return (
    <nav className="flex items-center gap-1 max-md:overflow-x-auto max-md:flex-nowrap max-md:-mx-4 max-md:px-4 max-md:pb-2 max-md:relative max-md:after:absolute max-md:after:right-0 max-md:after:top-0 max-md:after:bottom-0 max-md:after:w-8 max-md:after:bg-gradient-to-r max-md:after:from-transparent max-md:after:to-white max-md:after:pointer-events-none" role="tablist" aria-label="Filtrar resultados por tipo">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative px-4 py-2 text-sm font-medium rounded-full transition-colors
            ${
              activeTab === tab.id
                ? 'bg-[#0A0A0A] text-white'
                : 'bg-[#F5F5F5] text-[#6A7282] hover:bg-[#e8e8e8] hover:text-[#0A0A0A]'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[11px] opacity-70">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
