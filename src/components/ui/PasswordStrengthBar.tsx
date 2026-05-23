"use client";

import { CheckCircle2, Circle } from "lucide-react";

interface PasswordStrengthBarProps {
  password: string;
}

interface PasswordCheck {
  label: string;
  met: boolean;
}

export default function PasswordStrengthBar({
  password,
}: PasswordStrengthBarProps) {
  const checks: PasswordCheck[] = [
    { label: "8+ caracteres", met: password.length >= 8 },
    { label: "Una mayúscula", met: /[A-Z]/.test(password) },
    { label: "Una minúscula", met: /[a-z]/.test(password) },
    { label: "Un número", met: /[0-9]/.test(password) },
    { label: "Un carácter especial", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const strength = checks.filter((c) => c.met).length;
  const strengthPercent = (strength / checks.length) * 100;
  const strengthColor =
    strengthPercent <= 40
      ? "bg-red-500"
      : strengthPercent <= 80
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div
        className="h-2 w-full rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={strengthPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Fortaleza de la contraseña"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>
      {/* Checklist */}
      <ul className="space-y-1 text-sm">
        {checks.map((check) => (
          <li
            key={check.label}
            className={`flex items-center gap-1.5 ${
              check.met ? "text-green-600" : "text-gray-400"
            }`}
          >
            {check.met ? (
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Circle className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
