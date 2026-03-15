'use client';

import { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  type: 'hotel' | 'vuelo';
  name: string;
  price: number;
}

export default function CarritoPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Cargar del localStorage
    const saved = localStorage.getItem('proactrip_cart');
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  const removeItem = (id: string) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem('proactrip_cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Mi Carrito</h1>
      
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-8xl mb-4">🛒</div>
          <p className="text-gray-600">Tu carrito está vacío</p>
        </div>
      ) : (
        <div>
          {cart.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-lg shadow mb-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-gray-600">{item.type}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-xl">{item.price}€</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          
          <div className="bg-gray-50 p-6 rounded-lg mt-6">
            <div className="flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span>{total}€</span>
            </div>
            <button className="w-full mt-4 bg-[#FF6B6B] text-white py-3 rounded-lg font-bold">
              Proceder al pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
}