export function parseVersion(v?: string): { major: number; minor: number; patch: number } {
  if (!v) return { major: 0, minor: 0, patch: 0 };
  const [M, m, p] = v.split('.');
  return {
    major: parseInt(M || '0', 10),
    minor: parseInt(m || '0', 10),
    patch: parseInt(p || '0', 10)
  };
}