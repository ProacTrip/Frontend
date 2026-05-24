"use client";

import { motion, AnimatePresence } from "framer-motion";

interface BackdropProps {
  isVisible: boolean;
  onClick: () => void;
}

export default function Backdrop({ isVisible, onClick }: BackdropProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 top-0 z-30 bg-black/40 backdrop-blur-[2px] cursor-pointer"
          onClick={onClick}
        />
      )}
    </AnimatePresence>
  );
}
