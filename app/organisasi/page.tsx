import { redirect } from 'next/navigation';
import { apiFetch, mockManagementYears, type ManagementYear } from '../utils/api';

export default async function OrganisasiRootPage() {
  const years = await apiFetch<ManagementYear[]>('/management-years', mockManagementYears);

  // Find the latest management year period or fallback to '2024-2025'
  const latestYear = years[0]?.slug || '2024-2025';

  redirect(`/organisasi/${latestYear}`);
}
