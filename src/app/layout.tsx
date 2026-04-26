import type { Metadata } from 'next';
import { AuthProvider } from '@ui/hooks/useAuth';
import { ErrorBoundary } from '@ui/components/ErrorBoundary';
import { StorefrontShell } from '@ui/layouts/StorefrontShell';
import '../index.css';

export const metadata: Metadata = {
    title: 'PlayMoreTCG',
    description: 'TCG ecommerce storefront',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ErrorBoundary>
                    <AuthProvider>
                        <StorefrontShell>
                            {children}
                        </StorefrontShell>
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
