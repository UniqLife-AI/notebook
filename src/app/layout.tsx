// File Name: src/app/layout.tsx

import ThemeRegistry from '@/components/ThemeRegistry';
import { NotificationsProvider } from '@/components/NotificationsProvider';

export const metadata = {
  title: 'Notebook by UniqLife-AI',
  description: 'A local-first, privacy-focused LLM notebook.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ThemeRegistry>
          <NotificationsProvider>
            {children}
          </NotificationsProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}