"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps {
  label: string;
  type: string;
  placeholder?: string;
  id: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPasswordToggle?: boolean;
}

export default function InputField({
  label,
  type,
  placeholder,
  id,
  name,
  value,
  onChange,
  showPasswordToggle = false,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="mb-1.5 text-sm font-medium text-neutral-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl
                     text-neutral-900 placeholder:text-neutral-400
                     focus:outline-none focus:border-neutral-400 focus:bg-white
                     transition-all duration-200"
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
