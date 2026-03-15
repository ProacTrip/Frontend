import Navbar from '@/components/layout/Navbar';
import { LoginLocationDetector } from '@/components/LoginLocationDetector';

export default function HomeLayout({
  // Recibe el contenido específico de cada página
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">  
      <LoginLocationDetector />
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}