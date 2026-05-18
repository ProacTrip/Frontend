// app/admin/audit/page.tsx
// Auditoría — funcionalidad en desarrollo.
// El backend aún no expone /v1/management/audit-logs.

'use client';

import { ClipboardList } from 'lucide-react';

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-[#c54141]" />
          Auditoría
        </h1>
        <p className="text-gray-500 text-sm mt-1">Historial de acciones del sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Auditoría no disponible
          </h2>
          <p className="text-gray-500">
            Esta funcionalidad está en desarrollo. El backend aún no expone
            el endpoint de registros de auditoría. Volvé a consultar en
            próximas actualizaciones.
          </p>
        </div>
      </div>
    </div>
  );
}
