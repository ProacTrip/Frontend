"use client";

import { useState, useId } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, Label, Input, Description } from "@headlessui/react";

interface InputFieldProps {
  label: string;
  type: string;
  placeholder?: string;
  id?: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPasswordToggle?: boolean;
  /** Error message to display below the input. When set, the input
   *  gets a red border and the error is announced via role="alert". */
  error?: string;
}

export default function InputField({
  label,
  type,
  placeholder,
  id: externalId,
  name,
  value,
  onChange,
  showPasswordToggle = false,
  error,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const id = externalId || generatedId;
  const errorId = `${id}-error`;

  const inputType =
    showPasswordToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

  return (
    <Field className="flex flex-col">
      <Label
        htmlFor={id}
        className="mb-1.5 text-sm font-medium text-neutral-700"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          type={inputType}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className={`w-full px-4 py-3 text-sm bg-neutral-50 border rounded-xl
                     text-neutral-900 placeholder:text-neutral-400
                     focus:outline-none focus:bg-white
                     transition-all duration-200
                     ${
                       error
                         ? "border-red-500 focus:border-red-500"
                         : "border-neutral-200 focus:border-neutral-400"
                     }`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <Description id={errorId} className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </Description>
      )}
    </Field>
  );
}
