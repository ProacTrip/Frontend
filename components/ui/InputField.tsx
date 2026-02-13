'use client'; 
//se usa use client pa cuando hay algun efecto tipo click o de alguna forma 
//algo q haga cambiar la informacion o el componente de alguna forma

import { useState } from 'react';
// Importamos useState, que sirve para guardar datos que cambian (estado).

import { Eye, EyeOff } from 'lucide-react';
// Importamos iconos SVG como componentes React (ojo y ojo tachado).


interface InputFieldProps {
  label: string; // Texto del label (obligatorio)
  type: string; // Tipo del input (text, email, password...)
  placeholder?: string; // Texto dentro del input (opcional)
  id: string; // Identificador del input (para accesibilidad)
  name: string; // Nombre del campo (formularios)
  value?: string; // Valor actual del input (opcional)
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Función que se ejecuta cuando el usuario escribe
  showPasswordToggle?: boolean;
  // Indica si se muestra el botón para ver/ocultar contraseña
}

//Ponemos predeterminado la contraseña q no se pueda ver
export default function InputField({label,type,placeholder,id,name,value,onChange,showPasswordToggle = false}: InputFieldProps) 
{
  const [showPassword, setShowPassword] = useState(false);

  // Decidimos el tipo del input:
  // - Si hay toggle de contraseña:
  //     - true  -> text
  //     - false -> password
  // - Si no hay toggle -> usamos el type normal
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password'): type;

  return (
    <div className="flex flex-col mb-4">
      
      {/* Label asociado al input */}
      <label htmlFor={id} className="mb-2 text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Contenedor relativo para posicionar el icono */}
      <div className="relative">

        {/* Input principal */}
        <input
          type={inputType} // Tipo dinámico
          id={id} // Conecta con el label
          name={name} // Nombre del campo
          value={value} // Valor controlado
          onChange={onChange} // Maneja cambios
          placeholder={placeholder} // Texto de ayuda
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#8d6e63]
                     focus:border-transparent transition-all duration-200
                     text-gray-900 placeholder:text-gray-400"
        />

        {/* Botón para mostrar/ocultar contraseña */}
        {showPasswordToggle && (
          <button
            type="button" // IMPORTANTE: no envía formularios
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {/* Si es true Contraseña visible - icono ojo abierto
            Si es false Contrase no visibile - icono ojo cerrado*/}

            {showPassword ? (<EyeOff size={20} /> ) : (<Eye size={20} />)}
          </button>
        )}

      </div>
    </div>
  );
}
