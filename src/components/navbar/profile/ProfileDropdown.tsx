"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, UserCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthContext } from "@/contexts/AuthContext";
import { USER_AVATAR_CACHE_KEY } from "@/app/lib/constants/avatars";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { user, context } = useAuthContext();
  const router = useRouter();

  const avatarUrl = (() => {
    try { return localStorage.getItem(USER_AVATAR_CACHE_KEY) || null; }
    catch { return null; }
  })();

  const userName = user?.email
    ? user.email.split("@")[0]
    : null;

  const locationLine = context?.location
    ? `${context.location.city || ""}, ${context.location.country_code || ""}`
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-12 w-[280px] bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-[#E5E7EB] p-2 z-50 overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center gap-3 px-3 py-4">
                <div className="w-10 h-10 rounded-full bg-[#F5F5F5] animate-pulse" />
                <div className="space-y-1.5">
                  <div className="w-24 h-4 bg-[#F5F5F5] rounded animate-pulse" />
                  <div className="w-16 h-3 bg-[#F5F5F5] rounded animate-pulse" />
                </div>
              </div>
            ) : isAuthenticated ? (
              <>
                {/* USER HEADER */}
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F5] overflow-hidden flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${avatarUrl ? "hidden" : ""}`}>
                      <User className="w-5 h-5 text-[#6A7282]" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0A0A0A] truncate">
                      {userName || "Usuario"}
                    </p>
                    {locationLine && (
                      <p className="text-[13px] text-[#6A7282] truncate">{locationLine}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-[#F5F5F5] my-1" />

                {/* MENU ITEMS */}
                <button
                  onClick={() => { onClose(); router.push("/perfil"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FAFAFA] transition-colors"
                >
                  <UserCircle className="w-[18px] h-[18px] text-[#6A7282]" />
                  <span className="text-[14px] text-[#0A0A0A]">Perfil</span>
                </button>

                <button
                  onClick={() => { onClose(); logout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FAFAFA] transition-colors"
                >
                  <LogOut className="w-[18px] h-[18px] text-[#6A7282]" />
                  <span className="text-[14px] text-[#0A0A0A]">Cerrar sesión</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { onClose(); router.push("/auth/login"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FAFAFA] transition-colors"
                >
                  <UserCircle className="w-[18px] h-[18px] text-[#6A7282]" />
                  <span className="text-[14px] text-[#0A0A0A]">Iniciar sesión</span>
                </button>
                <button
                  onClick={() => { onClose(); router.push("/auth/register"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FAFAFA] transition-colors"
                >
                  <User className="w-[18px] h-[18px] text-[#6A7282]" />
                  <span className="text-[14px] text-[#0A0A0A]">Registrarse</span>
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
