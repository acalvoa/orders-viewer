import { AntdRegistry } from '@ant-design/nextjs-registry';
import ClientProviders from '@/components/ClientProviders';
import AppShell from '@/components/AppShell';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ClientProviders>
            <AppShell>{children}</AppShell>
          </ClientProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
