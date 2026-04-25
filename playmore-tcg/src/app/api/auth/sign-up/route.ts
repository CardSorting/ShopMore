import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { setSessionUser } from '@infrastructure/server/session';

export async function POST(request: Request) {
    try {
        const { email, password, displayName } = await request.json();
        const services = await getServerServices();
        const user = await services.authService.signUp(email, password, displayName);
        await setSessionUser(user);
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Registration failed' }, { status: 400 });
    }
}
