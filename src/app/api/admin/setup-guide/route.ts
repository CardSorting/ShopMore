import { getInitialServices } from '@core/container';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await requireAdminSession();
    const services = getInitialServices();
    const progress = await services.settingsService.getSetupProgress();
    return NextResponse.json(progress);
  } catch (err) {
    return jsonError(err, 'Failed to fetch setup progress');
  }
}
