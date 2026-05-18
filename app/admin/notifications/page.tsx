// app/admin/notifications/page.tsx
// Placeholder: endpoints de notificaciones admin no implementados en backend aún.

'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

export default function AdminNotificationsPage() {
  return (
    <div className="text-center py-20">
      <Bell className="w-16 h-16 text-gray-200 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Notificaciones</h1>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        La gestión de plantillas de notificación y envíos masivos no está disponible aún.
        Los endpoints del backend para esta funcionalidad están en desarrollo.
      </p>
      <Link
        href="/admin"
        className="text-[#c54141] hover:underline font-medium"
      >
        Volver al dashboard
      </Link>
    </div>
  );
}
