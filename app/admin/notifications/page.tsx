// app/admin/notifications/page.tsx
// Panel admin: gestión de plantillas + envío manual de notificaciones

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  Plus,
  Pencil,
  Power,
  PowerOff,
  Send,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  Mail,
  MessageSquare,
  FileText,
  Code
} from 'lucide-react';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  toggleTemplate,
  sendNotification,
} from '@/app/lib/api';
import type { NotificationTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '@/app/lib/types/notification-admin';
import DataTable, { Column } from '@/components/admin/DataTable';

type NotificationType = 'transactional' | 'marketing' | 'system';
type NotificationChannel = 'email' | 'sms';

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  // Form crear
  const [createForm, setCreateForm] = useState<CreateTemplateRequest>({
    code: '',
    name: '',
    subject: '',
    body: '',
    type: 'transactional',
    channel: 'email',
    is_active: true,
  });

  // Form editar
  const [editForm, setEditForm] = useState<Partial<UpdateTemplateRequest> & { body?: string }>({});

  // Form envío
  const [sendForm, setSendForm] = useState({
    user_id: '',
    template_code: '',
    channel: 'email' as NotificationChannel,
    data: '',
  });
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTemplates(false); // todas, incluso inactivas
      setTemplates(res.templates || []);
    } catch (e) {
      console.error('Error cargando plantillas:', e);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ==================== ACCIONES ====================

  const handleCreate = async () => {
    if (!createForm.code.trim() || !createForm.name.trim() || !createForm.subject.trim()) {
      alert('Completa los campos obligatorios');
      return;
    }
    setActionLoading('create');
    try {
      await createTemplate(createForm);
      setShowCreateModal(false);
      setCreateForm({
        code: '',
        name: '',
        subject: '',
        body: '',
        type: 'transactional',
        channel: 'email',
        is_active: true,
      });
      await loadTemplates();
    } catch (error: any) {
      alert(error.message || 'Error creando plantilla');
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      id: template.id,
      code: template.code,
      name: template.name,
      subject: template.subject,
      type: template.type,
      channel: template.channel,
      is_active: template.is_active,
      // body no viene del listado, se deja vacío (no se envía si está vacío)
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editForm.id) return;
    setActionLoading('update');
    try {
      const payload: UpdateTemplateRequest = {
        id: editForm.id,
        ...(editForm.code && { code: editForm.code }),
        ...(editForm.name && { name: editForm.name }),
        ...(editForm.subject && { subject: editForm.subject }),
        ...(editForm.body && editForm.body.trim() && { body: editForm.body }),
        ...(editForm.type && { type: editForm.type }),
        ...(editForm.channel && { channel: editForm.channel }),
        ...(editForm.is_active !== undefined && { is_active: editForm.is_active }),
      };
      await updateTemplate(payload);
      setShowEditModal(false);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (error: any) {
      alert(error.message || 'Error actualizando plantilla');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle = async (template: NotificationTemplate) => {
    setActionLoading(`toggle-${template.id}`);
    try {
      await toggleTemplate({
        id: template.id,
        active: !template.is_active,
      });
      await loadTemplates();
    } catch (error: any) {
      alert(error.message || 'Error cambiando estado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSend = async () => {
    if (!sendForm.user_id.trim() || !sendForm.template_code.trim()) {
      setSendError('Usuario y plantilla son obligatorios');
      return;
    }
    setSendError('');
    setSending(true);
    setSendSuccess(false);

    try {
      let data: Record<string, string> | undefined;
      if (sendForm.data.trim()) {
        try {
          data = JSON.parse(sendForm.data);
        } catch {
          setSendError('El campo "Datos" debe ser un JSON válido');
          setSending(false);
          return;
        }
      }

      await sendNotification({
        user_id: sendForm.user_id.trim(),
        template_code: sendForm.template_code,
        channel: sendForm.channel,
        ...(data && { data }),
      });

      setSendSuccess(true);
      setSendForm({ user_id: '', template_code: '', channel: 'email', data: '' });
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error: any) {
      setSendError(error.message || 'Error enviando notificación');
    } finally {
      setSending(false);
    }
  };

  // ==================== RENDER HELPERS ====================

  const getTypeBadge = (type: string) => {
    const configs: Record<string, string> = {
      transactional: 'bg-blue-100 text-blue-700 border-blue-200',
      marketing: 'bg-purple-100 text-purple-700 border-purple-200',
      system: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${configs[type] || configs.system}`}>
        {type}
      </span>
    );
  };

  const getChannelBadge = (channel: string) => {
    return channel === 'email' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-sky-100 text-sky-700 border-sky-200">
        <Mail className="w-3 h-3" />
        Email
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-200">
        <MessageSquare className="w-3 h-3" />
        SMS
      </span>
    );
  };

  const getActiveBadge = (active: boolean) => {
    return active ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
        <Power className="w-3 h-3" />
        Activa
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
        <PowerOff className="w-3 h-3" />
        Inactiva
      </span>
    );
  };

  const columns: Column<NotificationTemplate>[] = [
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-sm text-gray-900">{row.code}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-900">{row.name}</span>,
    },
    {
      key: 'subject',
      header: 'Asunto',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-600 truncate max-w-[200px] block">{row.subject}</span>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      width: 'w-32',
      render: (row) => getTypeBadge(row.type),
    },
    {
      key: 'channel',
      header: 'Canal',
      width: 'w-28',
      render: (row) => getChannelBadge(row.channel),
    },
    {
      key: 'is_active',
      header: 'Estado',
      width: 'w-28',
      render: (row) => getActiveBadge(row.is_active),
    },
    {
      key: 'actions' as any,
      header: 'Acciones',
      width: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-gray-500 hover:text-[#c54141] hover:bg-red-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggle(row)}
            disabled={actionLoading === `toggle-${row.id}`}
            className={`p-1.5 rounded-lg transition-colors ${
              row.is_active
                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
            } disabled:opacity-50`}
            title={row.is_active ? 'Desactivar' : 'Activar'}
          >
            {actionLoading === `toggle-${row.id}` ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : row.is_active ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
  ];

  const activeTemplates = templates.filter((t) => t.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#c54141]" />
            Notificaciones
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona plantillas y envía notificaciones manuales
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#c54141] text-white rounded-lg text-sm font-medium hover:bg-[#a93535] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva plantilla
        </button>
      </div>

      {/* Tabla de plantillas */}
      <DataTable
        columns={columns}
        data={templates}
        total={templates.length}
        loading={loading}
        limit={50}
        offset={0}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        emptyMessage="No hay plantillas de notificación"
      />

      {/* Envío manual */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-[#c54141]" />
          Enviar notificación manual
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID de usuario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sendForm.user_id}
              onChange={(e) => setSendForm((prev) => ({ ...prev, user_id: e.target.value }))}
              placeholder="uuid..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plantilla <span className="text-red-500">*</span>
            </label>
            <select
              value={sendForm.template_code}
              onChange={(e) => setSendForm((prev) => ({ ...prev, template_code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
            >
              <option value="">Selecciona plantilla...</option>
              {activeTemplates.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Canal <span className="text-red-500">*</span>
            </label>
            <select
              value={sendForm.channel}
              onChange={(e) => setSendForm((prev) => ({ ...prev, channel: e.target.value as NotificationChannel }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datos (JSON opcional)
            </label>
            <input
              type="text"
              value={sendForm.data}
              onChange={(e) => setSendForm((prev) => ({ ...prev, data: e.target.value }))}
              placeholder='{"name":"John"}'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
            />
          </div>
        </div>

        {sendError && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{sendError}</p>
          </div>
        )}

        {sendSuccess && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700">Notificación enviada correctamente</p>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#c54141] text-white rounded-lg text-sm font-medium hover:bg-[#a93535] disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar notificación
          </button>
        </div>
      </div>

      {/* ==================== MODALES ==================== */}

      {/* Modal Crear */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Nueva plantilla">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="welcome_email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Welcome Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={createForm.subject}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Welcome to ProacTrip!"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido (HTML/Go template)</label>
              <textarea
                value={createForm.body}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, body: e.target.value }))}
                rows={5}
                placeholder="<h1>Welcome {{.name}}!</h1>"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value as NotificationType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
                >
                  <option value="transactional">Transaccional</option>
                  <option value="marketing">Marketing</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                <select
                  value={createForm.channel}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, channel: e.target.value as NotificationChannel }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={createForm.is_active}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-[#c54141] border-gray-300 rounded focus:ring-[#c54141]"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">Activa inmediatamente</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 bg-[#c54141] text-white rounded-lg hover:bg-[#a93535] disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading === 'create' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Crear plantilla'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Editar */}
      {showEditModal && editingTemplate && (
        <Modal onClose={() => setShowEditModal(false)} title="Editar plantilla">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  type="text"
                  value={editForm.code || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
              <input
                type="text"
                value={editForm.subject || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenido <span className="text-xs text-gray-400 font-normal">(solo si quieres cambiarlo)</span>
              </label>
              <textarea
                value={editForm.body || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, body: e.target.value }))}
                rows={5}
                placeholder="El contenido anterior no se muestra en la lista. Escribe aquí para actualizarlo."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={editForm.type || 'transactional'}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value as NotificationType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
                >
                  <option value="transactional">Transaccional</option>
                  <option value="marketing">Marketing</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                <select
                  value={editForm.channel || 'email'}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, channel: e.target.value as NotificationChannel }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={editForm.is_active ?? true}
                onChange={(e) => setEditForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-[#c54141] border-gray-300 rounded focus:ring-[#c54141]"
              />
              <label htmlFor="edit_is_active" className="text-sm text-gray-700">Plantilla activa</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 bg-[#c54141] text-white rounded-lg hover:bg-[#a93535] disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading === 'update' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==================== COMPONENTE MODAL ====================

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}