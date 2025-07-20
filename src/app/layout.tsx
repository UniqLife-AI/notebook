import ThemeRegistry from '@/components/ThemeRegistry';

export const metadata = {
  title: 'Notebook by UniqLife-AI',
  description: 'A local-first, privacy-focused LLM notebook.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
