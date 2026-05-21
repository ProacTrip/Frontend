export interface Country {
  code: string;
  name: string;
  phone: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: 'ES', name: 'España', phone: '+34', flag: '🇪🇸' },
  { code: 'FR', name: 'Francia', phone: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', phone: '+39', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemania', phone: '+49', flag: '🇩🇪' },
  { code: 'PT', name: 'Portugal', phone: '+351', flag: '🇵🇹' },
  { code: 'GB', name: 'Reino Unido', phone: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'Estados Unidos', phone: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', phone: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', phone: '+54', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', phone: '+57', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', phone: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', phone: '+51', flag: '🇵🇪' },
  { code: 'BR', name: 'Brasil', phone: '+55', flag: '🇧🇷' },
  { code: 'VE', name: 'Venezuela', phone: '+58', flag: '🇻🇪' },
  { code: 'CA', name: 'Canadá', phone: '+1', flag: '🇨🇦' },
  { code: 'CN', name: 'China', phone: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japón', phone: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'Corea del Sur', phone: '+82', flag: '🇰🇷' },
  { code: 'AU', name: 'Australia', phone: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nueva Zelanda', phone: '+64', flag: '🇳🇿' },
  { code: 'IN', name: 'India', phone: '+91', flag: '🇮🇳' },
  { code: 'TH', name: 'Tailandia', phone: '+66', flag: '🇹🇭' },
  { code: 'SG', name: 'Singapur', phone: '+65', flag: '🇸🇬' },
  { code: 'TR', name: 'Turquía', phone: '+90', flag: '🇹🇷' },
  { code: 'AE', name: 'Emiratos Árabes', phone: '+971', flag: '🇦🇪' },
  { code: 'RU', name: 'Rusia', phone: '+7', flag: '🇷🇺' },
  { code: 'NL', name: 'Países Bajos', phone: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Bélgica', phone: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suiza', phone: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', phone: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Suecia', phone: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Noruega', phone: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Dinamarca', phone: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finlandia', phone: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Irlanda', phone: '+353', flag: '🇮🇪' },
  { code: 'GR', name: 'Grecia', phone: '+30', flag: '🇬🇷' },
];

/**
 * Busca un país por su código ISO (ej: "ES", "FR")
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Busca un país por su nombre
 */
export function getCountryByName(name: string): Country | undefined {
  return COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}