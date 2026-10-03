export const CATEGORIES = [
  { key: 'seed', label: '종자·종묘비', short: '종자·종묘', fields: ['종자/종묘비_비용'] },
  { key: 'fertilizer', label: '비료·영양제비', short: '비료·영양제', fields: ['유기질비료_비용', '무기질비료_비용'] },
  { key: 'pest', label: '농약·방제비', short: '농약·방제', fields: ['농약비_비용'] },
  { key: 'energy', label: '수도광열비', short: '수도광열', fields: ['수도광열비_비용'] },
  { key: 'materials', label: '시설·기타 재료비', short: '시설·재료', fields: ['기타재료비_비용'] },
  { key: 'maintenance', label: '유지보수·감가상각비', short: '유지·감가', fields: ['대농기구상각비_비용', '영농시설상각비_비용', '수리유지비_합계'] },
  { key: 'labor', label: '인건비', short: '인건비', fields: ['고용노동비_비용', '위탁영농비_비용'] },
  { key: 'rent', label: '임차료', short: '임차료', fields: ['임차료(농기계시설)_비용', '토지임차료_비용'] },
  { key: 'opportunity', label: '기회비용', short: '기회비용', fields: ['자가노동비_비용', '유동자본용역비_비용', '고정자본용역비_비용', '토지자본용역비_비용'] },
] as const;
export type CategoryKey = typeof CATEGORIES[number]['key'];
export type Costs = Record<CategoryKey, number>;
export const emptyCosts = (): Costs => Object.fromEntries(CATEGORIES.map(c => [c.key, 0])) as Costs;
export function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const result = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim().replaceAll(',', '')) : NaN;
  return Number.isFinite(result) ? result : null;
}
export function calculateNineCategories(row: Record<string, unknown>, allowVerifiedBlank = false): Costs {
  const result = emptyCosts();
  for (const c of CATEGORIES) for (const field of c.fields) {
    const v = numeric(row[field]);
    if (v === null && row[field] !== null && row[field] !== undefined && row[field] !== '') throw new Error(`숫자 변환 불가: ${field}`);
    if (v === null && !allowVerifiedBlank) throw new Error(`비용 누락: ${field}`);
    if (v !== null && v < 0) throw new Error(`음수 비용: ${field}`);
    result[c.key] += v ?? 0;
  }
  return result;
}
export function median(values: number[]): number {
  if (!values.length || values.some(v => !Number.isFinite(v))) throw new Error('유효한 중앙값 표본이 필요합니다.');
  const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
export function standardizeTo300(value: number, area: number): number {
  if (!Number.isFinite(value) || value < 0 || !Number.isFinite(area) || area <= 0) throw new Error('금액은 0 이상, 면적은 0보다 커야 합니다.');
  const result = value * (300 / area);
  if (!Number.isFinite(result)) throw new Error('환산 가능한 범위를 초과했습니다.');
  return result;
}
export function netProfitRate(net: number, revenue: number): number {
  if (!Number.isFinite(net) || !Number.isFinite(revenue) || revenue <= 0) throw new Error('총수입은 양수여야 합니다.');
  return net / revenue * 100;
}
export function selectTop10<T extends { rate: number }>(rows: T[]): T[] {
  if (!rows.length || rows.some(r => !Number.isFinite(r.rate))) throw new Error('유효한 코호트가 필요합니다.');
  const sorted = [...rows].sort((a, b) => b.rate - a.rate);
  const cut = sorted[Math.ceil(rows.length * .1) - 1].rate;
  return sorted.filter(r => r.rate >= cut); // 경계 동점 모두 포함
}
export function gap(user: number, benchmark: number) {
  if (![user, benchmark].every(v => Number.isFinite(v) && v >= 0)) throw new Error('유효한 비용이 필요합니다.');
  const amount = user - benchmark; const pct = benchmark > 0 ? amount / benchmark * 100 : null;
  return { amount, pct, index: benchmark > 0 ? user / benchmark * 100 : null,
    status: pct === null ? 'unavailable' : pct > 15 ? 'high' : pct < -15 ? 'low' : 'similar' } as const;
}
export function simulate(revenue: number, costs: Costs, changes: Costs) {
  if (!Number.isFinite(revenue) || revenue < 0) throw new Error('유효한 매출이 필요합니다.');
  const adjusted = emptyCosts();
  for (const c of CATEGORIES) {
    if (!Number.isFinite(costs[c.key]) || costs[c.key] < 0 || !Number.isFinite(changes[c.key]) || Math.abs(changes[c.key]) > 30) throw new Error('비용 또는 변경률이 유효하지 않습니다.');
    adjusted[c.key] = costs[c.key] * (1 + changes[c.key] / 100);
  }
  const total = sumCosts(adjusted); const balance = revenue - total;
  return { adjusted, total, balance, delta: balance - (revenue - sumCosts(costs)), revenueRate: revenue > 0 ? balance / revenue * 100 : null };
}
export const sumCosts = (costs: Costs) => CATEGORIES.reduce((s, c) => s + costs[c.key], 0);
export const MIN_COHORT = 50;
export type Benchmark = { crop: string; region: string; cohortSize: number; top10Count: number; top10Share: number; eligible: boolean; medianRevenue: number; medianNetProfit: number; medianNetProfitRate: number; medianOmittedCosts: number; costs: Costs };
export type CropBenchmark = { crop: string; national: Benchmark; regions: Record<string, Benchmark> };
export type BenchmarkData = {
  year: number; baseAreaPyeong: number; minCohortSize: number; regions: string[]; crops: CropBenchmark[];
  quality: { rawRows: number; validRows: number; excludedRows: number; uniqueFarmCount: number; cropCount: number; blankCostCellsVerifiedAsZero: number; exclusions: { row: number; reason: string }[]; policy: string[] };
};
export function resolveBenchmark(crop: CropBenchmark, region: string) {
  const regional = crop.regions[region];
  if (regional && regional.eligible && regional.cohortSize >= MIN_COHORT && regional.top10Count >= 5) return { benchmark: regional, fallback: false, regionalCount: regional.cohortSize };
  if (!crop.national.eligible || crop.national.cohortSize < MIN_COHORT || crop.national.top10Count < 5) throw new Error('비교 가능한 표본이 부족합니다.');
  return { benchmark: crop.national, fallback: region !== '전국', regionalCount: regional?.cohortSize ?? 0 };
}
export const formatMoney = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;
