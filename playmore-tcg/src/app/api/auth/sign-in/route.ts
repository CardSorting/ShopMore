import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { setSessionUser } from '@infrastructure/server/session';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        const services = await getServerServices();
        const user = await services.authService.signIn(email, password);
        await setSessionUser(user);
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Sign in failed' }, { status: 401 });
    }
}
