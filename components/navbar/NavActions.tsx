"use client";

import { useState } from "react";
import { User } from "lucide-react";
import CurrencySelector from "@/components/layout/CurrencySelector";
import ProfileDropdown from "./profile/ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";

interface NavActionsProps {
  isLanding: boolean;
}

export default function NavActions({ isLanding }: NavActionsProps) {
  const { isLoading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <CurrencySelector isScrolled={!isLanding} />

      {isLoading ? (
        <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
      ) : (
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors border ${
            isLanding
              ? "border-white/25 text-white hover:bg-white/10"
              : "border-[#E5E7EB] text-[#6A7282] hover:bg-[#F5F5F5]"
          }`}
        >
          <User className="w-5 h-5" />
        </button>
      )}

      <div className="relative">
        <ProfileDropdown
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
        />
      </div>
    </div>
  );
}
