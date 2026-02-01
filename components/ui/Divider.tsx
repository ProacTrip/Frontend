interface DividerProps {
  text?: string;
}

export default function Divider({ text="0" }: DividerProps) {
  return (
    <div className="flex items-center gap-4 my-6">
      {/* Línea izquierda */}
      <div className="flex-1 border-t bg-gray-300"></div>
      
      {/* Texto central */}
      <span className="text-sm text-gray-500 font-medium px-2">
        {text}
      </span>
      
      {/* Línea derecha */}
      <div className="flex-1 border-t bg-gray-300"></div>
    </div>
  );
}