import Navbar from '@/components/layout/Navbar';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
