import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/AccountShell';

export const metadata: Metadata = {
  title: { default: 'Mi Cuenta', template: '%s | ProacTrip' },
  description: 'Gestioná tu perfil, preferencias y documentos de viaje.',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountShell>{children}</AccountShell>;
}
