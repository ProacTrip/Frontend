"use client";

import CurrencySelector from "@/components/layout/CurrencySelector";
import WeatherDisplay from "@/components/layout/WeatherDisplay";
import ProfileDropdown from "./profile/ProfileDropdown";

interface NavActionsProps {
  isLanding: boolean;
}

export default function NavActions({ isLanding }: NavActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <WeatherDisplay isLanding={isLanding} />

      <CurrencySelector isScrolled={!isLanding} />

      <ProfileDropdown isLanding={isLanding} />
    </div>
  );
}
