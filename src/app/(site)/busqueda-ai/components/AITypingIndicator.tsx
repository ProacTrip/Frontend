// app/busqueda-ai/components/AITypingIndicator.tsx
'use client';

export default function AITypingIndicator() {
  return (
    <div className="flex gap-2 mb-4 justify-start">
      {/* AI avatar — monochrome */}
      <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0 mt-1">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      </div>

      <div className="bg-white border border-[#e8e8e8] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 bg-[#767676] rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-[#767676] rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-[#767676] rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
