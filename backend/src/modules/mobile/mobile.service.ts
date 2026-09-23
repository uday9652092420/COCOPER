import { getMobileBootstrapRepo } from './mobile.repository.js';
import type { MobileBootstrapResponse } from './mobile.types.js';

export async function getMobileBootstrap(userId: string): Promise<MobileBootstrapResponse | null> {
  const data = await getMobileBootstrapRepo(userId);

  if (!data) return null;

  return {
    success: true,
    ...data,
  };
}