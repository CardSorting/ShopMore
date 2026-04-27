import type { Metadata } from 'next';
import { AuthProvider } from '@ui/hooks/useAuth';
import { CartProvider } from '@ui/hooks/useCart';
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
                        <CartProvider>
                            <StorefrontShell>
                                {children}
                            </StorefrontShell>
                        </CartProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
