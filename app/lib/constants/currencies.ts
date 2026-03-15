//currencies sirve como un salvavidas por si la api externa falla
//Mapeamos las zonas horarias a monedas
export const TIMEZONE_CURRENCY_MAP: Record<string, string> = {
  //EUROPA - ZONA EURO
  'Europe/Madrid': 'EUR',
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Vienna': 'EUR',
  'Europe/Lisbon': 'EUR',
  'Europe/Athens': 'EUR',
  'Europe/Dublin': 'EUR',
  'Europe/Helsinki': 'EUR',
  'Europe/Luxembourg': 'EUR',
  'Europe/Bratislava': 'EUR',
  'Europe/Ljubljana': 'EUR',
  'Europe/Tallinn': 'EUR',
  'Europe/Riga': 'EUR',
  'Europe/Vilnius': 'EUR',
  'Europe/Malta': 'EUR',
  'Europe/Nicosia': 'EUR',
  
  //EUROPA - OTRAS MONEDAS
  'Europe/London': 'GBP',           // Reino Unido - Libra
  'Europe/Zurich': 'CHF',           // Suiza - Franco Suizo
  'Europe/Stockholm': 'SEK',        // Suecia - Corona Sueca
  'Europe/Oslo': 'NOK',             // Noruega - Corona Noruega
  'Europe/Copenhagen': 'DKK',       // Dinamarca - Corona Danesa
  'Europe/Prague': 'CZK',           // República Checa - Corona Checa
  'Europe/Warsaw': 'PLN',           // Polonia - Zloty
  'Europe/Budapest': 'HUF',         // Hungría - Forinto
  'Europe/Bucharest': 'RON',        // Rumanía - Leu
  'Europe/Moscow': 'RUB',           // Rusia - Rublo
  'Europe/Istanbul': 'TRY',         // Turquía - Lira Turca
  'Europe/Belgrade': 'RSD',         // Serbia - Dinar
  'Europe/Sofia': 'BGN',            // Bulgaria - Lev
  'Europe/Zagreb': 'HRK',           // Croacia - Kuna
  'Europe/Kiev': 'UAH',             // Ucrania - Grivna
  'Europe/Minsk': 'BYN',            // Bielorrusia - Rublo
  
  //ISLAS ATLÁNTICAS (ESPAÑA/PORTUGAL)
  'Atlantic/Canary': 'EUR',         // Islas Canarias (España)
  'Atlantic/Azores': 'EUR',         // Azores (Portugal)
  'Atlantic/Madeira': 'EUR',        // Madeira (Portugal)
  
  //AMÉRICA DEL NORTE - USD
  'America/New_York': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Phoenix': 'USD',
  'America/Anchorage': 'USD',
  'America/Honolulu': 'USD',
  
  //AMÉRICA DEL NORTE - OTRAS MONEDAS
  'America/Toronto': 'CAD',         // Canadá - Dólar Canadiense
  'America/Vancouver': 'CAD',
  'America/Montreal': 'CAD',
  'America/Mexico_City': 'MXN',     // México - Peso Mexicano
  'America/Guadalajara': 'MXN',
  'America/Monterrey': 'MXN',
  
  //AMÉRICA CENTRAL
  'America/Guatemala': 'GTQ',       // Guatemala - Quetzal
  'America/San_Salvador': 'USD',    // El Salvador usa USD
  'America/Tegucigalpa': 'HNL',     // Honduras - Lempira
  'America/Managua': 'NIO',         // Nicaragua - Córdoba
  'America/Costa_Rica': 'CRC',      // Costa Rica - Colón
  'America/Panama': 'USD',          // Panamá usa USD
  
  //AMÉRICA DEL SUR
  'America/Sao_Paulo': 'BRL',       // Brasil - Real
  'America/Buenos_Aires': 'ARS',    // Argentina - Peso Argentino
  'America/Santiago': 'CLP',        // Chile - Peso Chileno
  'America/Bogota': 'COP',          // Colombia - Peso Colombiano
  'America/Lima': 'PEN',            // Perú - Sol
  'America/Caracas': 'VES',         // Venezuela - Bolívar
  'America/La_Paz': 'BOB',          // Bolivia - Boliviano
  'America/Asuncion': 'PYG',        // Paraguay - Guaraní
  'America/Montevideo': 'UYU',      // Uruguay - Peso Uruguayo
  'America/Guyana': 'GYD',          // Guyana - Dólar Guyanés
  'America/Paramaribo': 'SRD',      // Surinam - Dólar Surinamés
  
  //CARIBE
  'America/Havana': 'CUP',          // Cuba - Peso Cubano
  'America/Santo_Domingo': 'DOP',   // República Dominicana - Peso
  'America/Port-au-Prince': 'HTG',  // Haití - Gourde
  'America/Jamaica': 'JMD',         // Jamaica - Dólar Jamaicano
  
  //ASIA - ORIENTE MEDIO
  'Asia/Dubai': 'AED',              // Emiratos Árabes - Dirham
  'Asia/Riyadh': 'SAR',             // Arabia Saudita - Riyal
  'Asia/Tel_Aviv': 'ILS',           // Israel - Shekel
  'Asia/Beirut': 'LBP',             // Líbano - Libra Libanesa
  'Asia/Baghdad': 'IQD',            // Irak - Dinar Iraquí
  'Asia/Tehran': 'IRR',             // Irán - Rial Iraní
  'Asia/Kuwait': 'KWD',             // Kuwait - Dinar Kuwaití
  'Asia/Qatar': 'QAR',              // Qatar - Riyal Qatarí
  
  //ASIA - ESTE Y SUDESTE ASIÁTICO
  'Asia/Tokyo': 'JPY',              // Japón - Yen
  'Asia/Shanghai': 'CNY',           // China - Yuan
  'Asia/Hong_Kong': 'HKD',          // Hong Kong - Dólar HK
  'Asia/Singapore': 'SGD',          // Singapur - Dólar Singapurense
  'Asia/Seoul': 'KRW',              // Corea del Sur - Won
  'Asia/Bangkok': 'THB',            // Tailandia - Baht
  'Asia/Manila': 'PHP',             // Filipinas - Peso Filipino
  'Asia/Jakarta': 'IDR',            // Indonesia - Rupia
  'Asia/Kuala_Lumpur': 'MYR',       // Malasia - Ringgit
  'Asia/Ho_Chi_Minh': 'VND',        // Vietnam - Dong
  'Asia/Taipei': 'TWD',             // Taiwán - Dólar Taiwanés
  
  //ASIA - SUR
  'Asia/Kolkata': 'INR',            // India - Rupia India
  'Asia/Karachi': 'PKR',            // Pakistán - Rupia Pakistaní
  'Asia/Dhaka': 'BDT',              // Bangladesh - Taka
  'Asia/Colombo': 'LKR',            // Sri Lanka - Rupia de Sri Lanka
  'Asia/Kathmandu': 'NPR',          // Nepal - Rupia Nepalí
  
  //OCEANÍA
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Australia/Brisbane': 'AUD',
  'Australia/Perth': 'AUD',
  'Pacific/Auckland': 'NZD',        // Nueva Zelanda - Dólar NZ
  'Pacific/Fiji': 'FJD',            // Fiyi - Dólar de Fiyi
  
  //ÁFRICA
  'Africa/Johannesburg': 'ZAR',     // Sudáfrica - Rand
  'Africa/Cairo': 'EGP',            // Egipto - Libra Egipcia
  'Africa/Lagos': 'NGN',            // Nigeria - Naira
  'Africa/Nairobi': 'KES',          // Kenia - Chelín Keniano
  'Africa/Casablanca': 'MAD',       // Marruecos - Dirham Marroquí
  'Africa/Algiers': 'DZD',          // Argelia - Dinar Argelino
  'Africa/Tunis': 'TND',            // Túnez - Dinar Tunecino
};