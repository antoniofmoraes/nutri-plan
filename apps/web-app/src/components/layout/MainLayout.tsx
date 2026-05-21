import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-bg grid grid-cols-1 min-[901px]:grid-cols-[256px_1fr]">
      <Sidebar />
      <main className="min-w-0">
        <div className="max-w-[1152px] mx-auto px-4 py-4 pb-20 min-[901px]:px-10 min-[901px]:py-8 min-[901px]:pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
