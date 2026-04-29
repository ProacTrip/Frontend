'use client';

export const dynamic = 'force-dynamic';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Send, Clock, CheckCircle2 } from 'lucide-react';
import Loader from '@/components/ui/Loader'; // ✅ IMPORTAMOS EL LOADER

export default function ContactanosPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
    
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 4000);
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3] overflow-hidden flex flex-col">
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 px-4"
      >
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
          Contáctanos
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          ¿Tienes alguna pregunta? Estamos aquí para ayudarte en cada paso de tu viaje
        </p>
      </motion.div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid lg:grid-cols-2 gap-6 h-full">
            
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-xl p-6 md:p-8 relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF6B6B]/10 to-transparent blur-3xl -z-10"></div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Envíanos un mensaje
              </h2>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center flex-1"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      ¡Mensaje enviado!
                    </h3>
                    <p className="text-gray-600 text-center">
                      Gracias por contactarnos. Te responderemos pronto.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="flex-1 flex flex-col space-y-4"
                  >
                    <div>
                      <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
                        Tu Nombre
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Ej: María García"
                        className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-[#FF6B6B] focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="tu@email.com"
                        className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-[#FF6B6B] focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-1">
                        Tu Mensaje
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        className="w-full flex-1 px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-[#FF6B6B] focus:bg-white outline-none transition-all resize-none"
                      />
                    </div>

                    {/* ✅ BOTÓN CON LOADER COMPONENT */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileTap={{ scale: 0.98 }}
                      className="group relative overflow-hidden w-full border-2 border-gray-300 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-[#FF6B6B] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out"></div>
                      
                      <div className="relative flex items-center justify-center gap-2 z-10 group-hover:text-white transition-colors duration-700">
                        {isSubmitting ? (
                          // ✅ USAMOS EL COMPONENTE LOADER
                          <Loader text="Enviando..." size="sm" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Enviar Mensaje
                          </>
                        )}
                      </div>
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* COLUMNA DERECHA: INFORMACIÓN DE CONTACTO */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-4 overflow-y-auto hide-scrollbar"
            >
              
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#FF6B6B] rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Llámanos</h3>
                </div>
                <p className="text-gray-300 text-sm mb-2">
                  Estamos disponibles para atenderte
                </p>
                <div className="space-y-1">
                  <a href="tel:+34900123456" className="block font-semibold hover:text-[#FF6B6B] transition-colors">
                    (+34) 900 123 456
                  </a>
                  <a href="tel:+34900987654" className="block font-semibold hover:text-[#FF6B6B] transition-colors">
                    (+34) 900 987 654
                  </a>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#FF6B6B] rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Localización</h3>
                </div>
                <p className="text-gray-300 text-sm mb-2">
                  Visítanos en nuestra oficina
                </p>
                <p className="font-semibold">
                  Calle Gran Vía, 123<br />
                  28013 Madrid, España
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#FF6B6B] rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Horario de Atención</h3>
                </div>
                <div className="space-y-1 text-sm text-gray-300">
                  <p><span className="font-semibold text-white">Lun - Vie:</span> 9:00 - 20:00</p>
                  <p><span className="font-semibold text-white">Sábados:</span> 10:00 - 14:00</p>
                  <p><span className="font-semibold text-white">Domingos:</span> Cerrado</p>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

    </div>
  );
}



//hasta q n tenga conexion con backend esta pagina la dejamos sin revision profunda de diseño / mejorar codigo