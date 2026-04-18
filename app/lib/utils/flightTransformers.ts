// app/lib/utils/flightTransformers.ts

// Imports unificados para limpieza (✅ CORREGIDO)
import type { 
  FlightOffer, 
  FlightLeg, 
  FlightSearchResponse 
} from '@/app/lib/types/flight';
import type { 
  FlightOfferUI, 
  SegmentUI, 
  LegUI, 
  LayoverUI 
} from '@/app/lib/types/flight';

// ==========================================
// TRANSFORMADOR PRINCIPAL (Oferta Individual)
// ==========================================

/**
 * Convierte una oferta de vuelo de la API a formato Frontend.
 */
export function transformFlightOffer(apiOffer: FlightOffer, isRecommended: boolean = false): FlightOfferUI {
  
  if (!apiOffer.legs || apiOffer.legs.length === 0) {
    throw new Error('La oferta de vuelo no tiene tramos válidos.');
  }

  const firstLeg = apiOffer.legs[0];

  // 1. Token y Fase
  const token = apiOffer.booking_token || apiOffer.outbound_selection_token || '';
  const isOutboundPhase = !!apiOffer.outbound_selection_token;

  // 2. Escalas (Layovers)
  const layovers: LayoverUI[] = (apiOffer.layovers || []).map(layover => ({
    airportCode: layover.airport_code,
    airportName: layover.airport_name,
    duration: layover.duration_minutes,
    overnight: layover.overnight,
    changeTerminal: layover.change_terminal
  }));

  // 3. Legs (Tramos)
  const transformedLegs: LegUI[] = apiOffer.legs.map(leg => transformLeg(leg));

  // 4. Segmento (Trayecto completo)
  const segments: SegmentUI[] = [{
    type: isOutboundPhase ? 'outbound' : 'return',
    legs: transformedLegs,
    layovers: layovers,
    totalDuration: apiOffer.total_duration_minutes,
  }];

  // 5. Aerolínea
  const airline = {
    name: firstLeg.airline,
    code: firstLeg.airline_code,
    logoUrl: firstLeg.airline_logo_url,
  };

  // 6. Precio
  const price = {
    total: apiOffer.price?.amount || 0,
    currency: apiOffer.price?.currency || 'EUR',
  };

  // 7. Features
  const features = firstLeg.features || { 
    wifi: null, power_outlets: false, usb: false, entertainment: null, raw: [] 
  };

  // 8. ✅ CORREGIDO: Lógica de oftenDelayed (Si algún leg se retrasa, el viaje se retrasa)
  const isAnyLegDelayed = apiOffer.legs.some(leg => leg.often_delayed);

  // 9. ✅ CORREGIDO: Mapeo de carbon_emissions
  const carbonData = apiOffer.carbon_emissions ? {
    thisFlight: apiOffer.carbon_emissions.this_flight_grams,
    typicalRoute: apiOffer.carbon_emissions.typical_route_grams,
    differencePercent: apiOffer.carbon_emissions.difference_percent,
  } : null;

  return {
    id: token,
    offerId: token,
    isOutboundPhase: isOutboundPhase,
    
    segments: segments,
    
    price: price,
    
    airline: airline,
    
    alsoSoldBy: apiOffer.also_sold_by || [],
    operatedBy: apiOffer.operated_by || null,
    
    oftenDelayed: isAnyLegDelayed, // ✅ CORREGIDO: Lógica mejorada
    
    baggage: null, // ✅ El tipo permite null, y en Search no viene info detallada
    
    isRecommended: isRecommended, // Asegúrate de tener este campo en tu FlightOfferUI type
    
    carbonEmissions: carbonData, // ✅ CORREGIDO: Datos de CO2
  };
}

// ==========================================
// TRANSFORMADOR DE RESPUESTA COMPLETA
// ==========================================

export function transformFlightSearchResponse(apiResponse: FlightSearchResponse): FlightOfferUI[] {
  const transformedOffers: FlightOfferUI[] = [];

  if (apiResponse.best_flights) {
    const best = apiResponse.best_flights.map(offer => transformFlightOffer(offer, true));
    transformedOffers.push(...best);
  }

  if (apiResponse.other_flights) {
    const other = apiResponse.other_flights.map(offer => transformFlightOffer(offer, false));
    transformedOffers.push(...other);
  }
  
  return transformedOffers;
}

// ==========================================
// HELPERS (Privados)
// ==========================================

function transformLeg(apiLeg: FlightLeg): LegUI {
  const features = apiLeg.features || { 
    wifi: null, power_outlets: false, usb: false, entertainment: null, raw: [] 
  };

  return {
    flightNumber: apiLeg.flight_number,
    airline: {
      name: apiLeg.airline,
      code: apiLeg.airline_code,
      logoUrl: apiLeg.airline_logo_url,
    },
    operatingCarrier: apiLeg.operated_by || undefined,  // Mapeo API -> UI
    
    origin: {
      ...transformAirportInfo(apiLeg.departure),
      terminal: apiLeg.departure.terminal 
    },
    destination: {
      ...transformAirportInfo(apiLeg.arrival),
      terminal: apiLeg.arrival.terminal 
    },
    
    duration: apiLeg.duration_minutes,
    aircraft: apiLeg.aircraft,

    features: {
      wifi: features.wifi === 'free' ? true : (features.wifi === 'paid' ? 'paid' : undefined),
      power: features.power_outlets,
      entertainment: features.entertainment === 'on_demand' ? true : (features.entertainment === 'stream' ? true : undefined),
    },
    
    oftenDelayed: apiLeg.often_delayed || false,

    legroom: apiLeg.legroom,
    overnight: apiLeg.overnight,
  };
}

function transformAirportInfo(apiAirport: { 
  airport_code: string; 
  airport_name: string; 
  city: string; 
  datetime: string; 
}): { code: string; name: string; city: string; datetime: string } {
  return {
    code: apiAirport.airport_code,
    name: apiAirport.airport_name,
    city: apiAirport.city,
    datetime: apiAirport.datetime,
  };
}