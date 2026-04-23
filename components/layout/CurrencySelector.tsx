'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, DollarSign } from 'lucide-react';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar USA' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
  { code: 'JPY', symbol: '¥', name: 'Yen japonés' },
  { code: 'CAD', symbol: 'C$', name: 'Dólar canadiense' },
  { code: 'AUD', symbol: 'A$', name: 'Dólar australiano' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco suizo' },
  { code: 'CNY', symbol: '¥', name: 'Yuan chino' },
];

export default function CurrencySelector() {
  const [currentCurrency, setCurrentCurrency] = useState('EUR');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Leer moneda actual al cargar
    try {
      const saved = localStorage.getItem('user_location');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.currency) setCurrentCurrency(data.currency);
      }
    } catch (e) {
      console.warn('Error leyendo moneda:', e);
    }
  }, []);

  const handleChange = (currencyCode: string) => {
    if (currencyCode === currentCurrency) {
      setIsOpen(false);
      return;
    }

    // Guardar en localStorage (sobrescribiendo solo la moneda)
    try {
      const saved = localStorage.getItem('user_location');
      const data = saved ? JSON.parse(saved) : {};
      data.currency = currencyCode;
      localStorage.setItem('user_location', JSON.stringify(data));
      
      console.log(`💱 Moneda cambiada a ${currencyCode}`);
    } catch (e) {
      console.error('Error guardando moneda:', e);
    }

    setIsOpen(false);
    
    // Recargar para aplicar la nueva moneda en la próxima búsqueda
    window.location.reload();
  };

  const current = CURRENCIES.find(c => c.code === currentCurrency) || CURRENCIES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
      >
        <DollarSign className="w-4 h-4" />
        <span>{current.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Selecciona moneda
            </p>
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleChange(currency.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left ${
                  currency.code === currentCurrency ? 'bg-red-50 text-[#c54141]' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold w-8">{currency.symbol}</span>
                  <span className="text-sm">{currency.name}</span>
                </div>
                <span className="text-xs font-medium text-gray-400">{currency.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}