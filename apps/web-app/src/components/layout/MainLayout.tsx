import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="container max-w-6xl py-6 px-4 lg:px-8 pt-20 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
