import { NextResponse } from 'next/server';
import { clearSessionUser } from '@infrastructure/server/session';
import { assertTrustedMutationOrigin, jsonError } from '@infrastructure/server/apiGuards';

export async function POST(request: Request) {
    try {
        assertTrustedMutationOrigin(request);
        await clearSessionUser();
        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error, 'Sign out failed');
    }
}
