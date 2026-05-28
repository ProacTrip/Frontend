// app/busqueda-ai/components/FollowUpPrompt.tsx
'use client';

const FIELD_LABELS: Record<string, string> = {
  departure: 'Ciudad de origen',
  arrival: 'Destino',
  outbound_date: 'Fecha de ida',
  return_date: 'Fecha de vuelta',
  check_in_date: 'Fecha de entrada',
  check_out_date: 'Fecha de salida',
  adults: 'Pasajeros',
  children: 'Niños',
  trip_type: 'Tipo de viaje',
  travel_class: 'Clase',
  max_price: 'Presupuesto máximo',
  rating: 'Calificación mínima',
  free_cancellation: 'Cancelación gratuita',
  stops: 'Escalas',
  sort_by: 'Ordenar por',
};

interface FollowUpPromptProps {
  missingFields: string[];
  onSelect: (field: string) => void;
}

export default function FollowUpPrompt({ missingFields, onSelect }: FollowUpPromptProps) {
  if (!missingFields || missingFields.length === 0) return null;

  return (
    <div className="flex gap-2 justify-start mb-4">
      {/* Avatar spacer to align with AI bubble */}
      <div className="w-8 h-8 flex-shrink-0 mt-1" />

      <div className="max-w-[80%] md:max-w-[70%]">
        <p className="text-[10px] text-[#6A7282] mb-1.5 ml-1">Datos que faltan:</p>
        <div className="flex flex-wrap gap-1.5">
          {missingFields.map((field) => (
            <button
              key={field}
              onClick={() => onSelect(field)}
              className="
                px-3 py-1.5 text-xs rounded-full border border-[#e8e8e8]
                bg-white text-[#0A0A0A] hover:border-[#0A0A0A]
                transition-colors cursor-pointer
              "
            >
              {FIELD_LABELS[field] || field}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
