import type { CheckoutData } from '@/app/home/checkout/components/BookingSummary';

const CHECKOUT_KEY = 'checkout_data';

/**
 * Guarda los datos de la reserva en localStorage y redirige a /home/checkout.
 * Se llama desde cualquier módulo (hoteles, vuelos, plan, experiencias)
 * justo antes de navegar al checkout centralizado.
 *
 * Ejemplo de uso desde habitaciones:
 *
 *   goToCheckout(router, {
 *     type: 'hotel',
 *     item_id: hotel.id,
 *     item_name: hotel.name,
 *     check_in: '2026-06-01',
 *     check_out: '2026-06-05',
 *     adults: 2,
 *     nights: 4,
 *     room_id: room.id,
 *     room_name: room.name,
 *     price_per_unit: room.price.amount,
 *     total_price: room.price.total,
 *     currency: 'EUR',
 *     cancellation_policy: 'Cancelación gratuita hasta 48h antes',
 *     image: room.images[0],
 *   });
 */
export function goToCheckout(
  router: { push: (url: string) => void },
  data: CheckoutData
) {
  localStorage.setItem(CHECKOUT_KEY, JSON.stringify(data));
  router.push('/home/checkout');
}