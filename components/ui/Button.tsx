
/*
que es React.ReactNode si estamos usando next? 
Recordemos q next esta hecho sobre react, osea es como un hermano mayor , y respecto a React.ReactNode
simplemente es una etiqueta de TypeScript para decirle al botón: "Oye, dentro de este botón puedes meter
cualquier cosa que React entienda (texto, un icono, o incluso otro componente)".
Es obligatorio usar tipos de React dentro de Next.js
*/
/*
Q es children?
Children es un contenedor q nos permite transportar mucha informacion de todo tipo html+tailwind+typescript a la vez
sin tener q estar haciendo copia pegas.
*/
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'google';
}

export default function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  const primaryStyles = "bg-[#8d6e63] hover:bg-[#795548] text-white shadow-md";
  const googleStyles = "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm";
  const baseStyles = "w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2";

  return (
    <button
      {...props}
      className={`${baseStyles} ${variant === 'primary' ? primaryStyles : googleStyles} ${props.className || ''}`}
    >
      {children}
    </button>
  );
}