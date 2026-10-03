import json from '../data/benchmark-2024.json';
import type { BenchmarkData } from './farm';
export const DATA: BenchmarkData = { ...json, crops: json.crops.map(c => ({ ...c, regions: Object.fromEntries(Object.entries(c.regions).filter(([, value]) => value !== undefined)) })) };
export const REGIONS = ['전국', ...DATA.regions, '울산광역시', '제주특별자치도'];
