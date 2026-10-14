import json from '../data/benchmark-2015-2024.json';
import type { BenchmarkData } from './farm';
export const YEAR_DATA = json.years as unknown as BenchmarkData[];
export const YEARS = YEAR_DATA.map(data => data.year).sort((a, b) => b - a);
export const LATEST_YEAR = YEARS[0];
export function getYearData(year: number): BenchmarkData {
  const data = YEAR_DATA.find(data => data.year === year);
  if (!data) throw new Error('지원하지 않는 조사연도입니다.');
  return data;
}
export const DATA = getYearData(LATEST_YEAR);
export const REGIONS = [...new Set(['전국', ...YEAR_DATA.flatMap(data => data.regions), '울산광역시', '제주특별자치도'])];
