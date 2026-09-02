const WORKSPACE_SLUG_BASE_LIMIT = 96;

export function buildWorkspaceSlug(rawName: string, entropy?: number): string {
  const base = rawName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, WORKSPACE_SLUG_BASE_LIMIT)
    .replace(/-+$/g, '') || 'workspace';
  const randomValue = (entropy ?? crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
  const suffix = randomValue
    .toString(36)
    .padStart(7, '0')
    .slice(-7);

  return `${base}-${suffix}`;
}
