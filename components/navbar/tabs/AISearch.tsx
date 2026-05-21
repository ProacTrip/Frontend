"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const SUGGESTIONS = [
  { emoji: "🌴", text: "Mejores destinos de playa" },
  { emoji: "❄️", text: "Viajes de invierno por menos de 500 €" },
  { emoji: "🎌", text: "Joyas ocultas en Asia" },
];

interface AISearchProps {
  message: string;
  onMessageChange: (v: string) => void;
  chat: { role: "user" | "assistant"; text: string }[];
  onSend: () => void;
}

export default function AISearch({
  message,
  onMessageChange,
  chat,
  onSend,
}: AISearchProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
    >
      {/* CHAT MESSAGES */}
      {chat.length > 0 && (
        <div className="max-h-56 overflow-y-auto mb-4 space-y-3 px-1">
          <AnimatePresence>
            {chat.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-[#0A0A0A] text-white rounded-br-md"
                      : "bg-[#F5F5F5] text-[#0A0A0A] rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
      )}

      {/* SUGGESTION CHIPS — only when empty */}
      {chat.length === 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              onClick={() => {
                onMessageChange(s.emoji + " " + s.text);
              }}
              className="rounded-full border border-[#E5E7EB] px-4 py-2 text-[13px] text-[#6A7282] hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors cursor-pointer"
            >
              {s.emoji} {s.text}
            </button>
          ))}
        </div>
      )}

      {/* INPUT ROW */}
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Pregúntame adónde ir, qué hacer, mejor momento para visitar..."
          className="flex-1 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-sm text-[#0A0A0A] placeholder-[#6A7282] italic outline-none focus:border-[#A1A1A1] focus:bg-white transition-colors"
        />
        <button
          onClick={onSend}
          disabled={!message.trim()}
          className="w-12 h-12 rounded-full bg-[#0A0A0A] hover:bg-[#262626] transition-colors flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </motion.div>
  );
}
