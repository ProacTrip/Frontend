'use client';

import { useState } from 'react';
import { CreditCard, User, Mail, Phone, Globe, AlertCircle, Lock } from 'lucide-react';

export interface GuestData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nationality: string;
  special_requests: string;
}

export interface CardData {
  card_number: string;
  card_expiry: string;
  card_cvv: string;
  card_holder: string;
}

interface PaymentFormProps {
  totalAmount: number;
  currency: string;
  isLoading: boolean;
  onSubmit: (guest: GuestData, card: CardData) => void;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
  card_holder?: string;
}

// Formateador de número de tarjeta (grupos de 4)
const formatCardNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 16);
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

// Formateador de expiración (MM/YY)
const formatExpiry = (value: string) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length >= 3) return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  return cleaned;
};

export default function PaymentForm({ totalAmount, currency, isLoading, onSubmit }: PaymentFormProps) {

  // ==================== DATOS DEL HUÉSPED ====================
  const [guest, setGuest] = useState<GuestData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    nationality: '',
    special_requests: '',
  });

  // ==================== DATOS DE LA TARJETA ====================
  const [card, setCard] = useState<CardData>({
    card_number: '',
    card_expiry: '',
    card_cvv: '',
    card_holder: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // ==================== ACTUALIZAR CAMPO HUÉSPED ====================
  const updateGuest = (field: keyof GuestData, value: string) => {
    setGuest(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // ==================== ACTUALIZAR CAMPO TARJETA ====================
  const updateCard = (field: keyof CardData, value: string) => {
    setCard(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // ==================== VALIDACIÓN ====================
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!guest.first_name.trim()) newErrors.first_name = 'Nombre obligatorio';
    if (!guest.last_name.trim()) newErrors.last_name = 'Apellido obligatorio';
    if (!guest.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!guest.phone.trim()) newErrors.phone = 'Teléfono obligatorio';
    if (!guest.nationality.trim()) newErrors.nationality = 'Nacionalidad obligatoria';

    const rawCard = card.card_number.replace(/\s/g, '');
    if (rawCard.length !== 16) newErrors.card_number = 'Número de tarjeta inválido (16 dígitos)';

    const expParts = card.card_expiry.split('/');
    if (expParts.length !== 2 || expParts[0].length !== 2 || expParts[1].length !== 2) {
      newErrors.card_expiry = 'Formato MM/AA';
    }
    if (card.card_cvv.replace(/\D/g, '').length < 3) newErrors.card_cvv = 'CVV inválido';
    if (!card.card_holder.trim()) newErrors.card_holder = 'Titular obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== SUBMIT ====================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }

    if (!validate()) return;

    const cleanCard: CardData = {
      ...card,
      card_number: card.card_number.replace(/\s/g, ''),
    };

    onSubmit(guest, cleanCard);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ==================== SECCIÓN 1: DATOS DEL HUÉSPED ==================== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-[#FF6B6B] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Datos del huésped principal</h2>
            <p className="text-xs text-gray-500">Se usarán para la confirmación de la reserva</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={guest.first_name}
                onChange={e => updateGuest('first_name', e.target.value)}
                placeholder="Juan"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none ${
                  errors.first_name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.first_name && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.first_name}
              </p>
            )}
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Apellido <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={guest.last_name}
                onChange={e => updateGuest('last_name', e.target.value)}
                placeholder="Pérez"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none ${
                  errors.last_name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.last_name && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.last_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={guest.email}
                onChange={e => updateGuest('email', e.target.value)}
                placeholder="juan@ejemplo.com"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.email}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={guest.phone}
                onChange={e => updateGuest('phone', e.target.value)}
                placeholder="+34 600 000 000"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none ${
                  errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.phone}
              </p>
            )}
          </div>

          {/* Nacionalidad */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Nacionalidad <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={guest.nationality}
                onChange={e => updateGuest('nationality', e.target.value)}
                placeholder="Española"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none ${
                  errors.nationality ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.nationality && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.nationality}
              </p>
            )}
          </div>

          {/* Peticiones especiales */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Peticiones especiales <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={guest.special_requests}
              onChange={e => updateGuest('special_requests', e.target.value)}
              placeholder="Habitación en planta alta, cama de matrimonio, llegada tardía..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none resize-none"
            />
          </div>

        </div>
      </div>

      {/* ==================== SECCIÓN 2: PAGO ==================== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-[#FF6B6B] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Datos de pago</h2>
            <p className="text-xs text-gray-500">Tus datos están protegidos con cifrado SSL</p>
          </div>
          {/* Iconos de tarjetas */}
          <div className="ml-auto flex items-center gap-2">
            <div className="px-2 py-1 border border-gray-200 rounded text-xs font-bold text-blue-800 bg-blue-50">VISA</div>
            <div className="px-2 py-1 border border-gray-200 rounded text-xs font-bold text-red-700 bg-red-50">MC</div>
            <div className="px-2 py-1 border border-gray-200 rounded text-xs font-bold text-blue-900 bg-blue-100">AMEX</div>
          </div>
        </div>

        <div className="space-y-4">

          {/* Número de tarjeta */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Número de tarjeta <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                inputMode="numeric"
                value={card.card_number}
                onChange={e => updateCard('card_number', formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none tracking-widest ${
                  errors.card_number ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.card_number && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.card_number}
              </p>
            )}
          </div>

          {/* Titular */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Titular de la tarjeta <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={card.card_holder}
                onChange={e => updateCard('card_holder', e.target.value.toUpperCase())}
                placeholder="JUAN PÉREZ"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm font-mono uppercase tracking-wider focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none ${
                  errors.card_holder ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.card_holder && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.card_holder}
              </p>
            )}
          </div>

          {/* Expiración + CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Fecha de expiración <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={card.card_expiry}
                onChange={e => updateCard('card_expiry', formatExpiry(e.target.value))}
                placeholder="MM/AA"
                maxLength={5}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none ${
                  errors.card_expiry ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.card_expiry && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                  <AlertCircle className="w-3 h-3" />{errors.card_expiry}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                CVV <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  inputMode="numeric"
                  value={card.card_cvv}
                  onChange={e => updateCard('card_cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••"
                  maxLength={4}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm font-mono tracking-widest focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none ${
                    errors.card_cvv ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.card_cvv && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                  <AlertCircle className="w-3 h-3" />{errors.card_cvv}
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Aviso de seguridad */}
        <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            Pago seguro con cifrado SSL de 256 bits. Nunca almacenamos los datos de tu tarjeta.
          </p>
        </div>
      </div>

      {/* ==================== TÉRMINOS Y CONDICIONES ==================== */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={e => {
              setAcceptedTerms(e.target.checked);
              setTermsError(false);
            }}
            className="mt-0.5 w-4 h-4 text-[#FF6B6B] border-gray-300 rounded focus:ring-[#FF6B6B] cursor-pointer"
          />
          <span className="text-sm text-gray-700">
            He leído y acepto los{' '}
            <span className="text-[#FF6B6B] font-medium cursor-pointer hover:underline">
              Términos y Condiciones
            </span>{' '}
            y la{' '}
            <span className="text-[#FF6B6B] font-medium cursor-pointer hover:underline">
              Política de Privacidad
            </span>{' '}
            de ProacTrip. Entiendo que al confirmar esta reserva acepto la política de cancelación indicada.
          </span>
        </label>
        {termsError && (
          <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2 ml-7">
            <AlertCircle className="w-3.5 h-3.5" />
            Debes aceptar los términos para continuar
          </p>
        )}
      </div>

      {/* ==================== BOTÓN CONFIRMAR ==================== */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#FF6B6B] text-white py-4 px-6 rounded-xl hover:bg-[#ff5252] transition-colors font-bold text-base flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Procesando pago...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Confirmar y pagar {currency} {(totalAmount + Math.round(totalAmount * 0.1)).toLocaleString('es-ES')}
          </>
        )}
      </button>
    </form>
  );
}