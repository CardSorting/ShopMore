import { cookies } from 'next/headers';
import type { User } from '@domain/models';

const COOKIE_NAME = 'pm_tcg_session';

export async function getSessionUser(): Promise<User | null> {
    const value = (await cookies()).get(COOKIE_NAME)?.value;
    if (!value) return null;
    try {
        const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as User;
        return { ...parsed, createdAt: new Date(parsed.createdAt) };
    } catch {
        return null;
    }
}

export async function setSessionUser(user: User) {
    const value = Buffer.from(JSON.stringify(user)).toString('base64url');
    (await cookies()).set(COOKIE_NAME, value, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
    });
}

export async function clearSessionUser() {
    (await cookies()).delete(COOKIE_NAME);
}
