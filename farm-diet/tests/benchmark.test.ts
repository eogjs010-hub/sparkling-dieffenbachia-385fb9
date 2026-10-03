import {describe,it,expect} from 'vitest';
import {DATA} from '../src/lib/benchmarks';
import {CATEGORIES,resolveBenchmark} from '../src/lib/farm';
describe('실제 2024년 전처리 결과',()=>{
 it('원본 1130건 중 품질 이슈 3건을 보류하고 13개 작목을 유지한다',()=>{expect(DATA.quality.rawRows).toBe(1130);expect(DATA.quality.validRows).toBe(1127);expect(DATA.quality.excludedRows).toBe(3);expect(DATA.crops).toHaveLength(13);expect(DATA.crops.reduce((s,c)=>s+c.national.cohortSize,0)).toBe(1127);expect(DATA.quality.exclusions.map(r=>r.row)).toEqual([914,926,1122]);});
 it('원본 300평 기준을 그대로 보존한다',()=>expect(DATA.baseAreaPyeong).toBe(300));
 it('수박 전국 표본 104건과 상위군 11건을 유지한다',()=>{const c=DATA.crops.find(c=>c.crop==='시설수박')!;expect(c.national.cohortSize).toBe(104);expect(c.national.top10Count).toBe(11);expect(c.national.medianNetProfitRate).toBeCloseTo(54.84770338145831,8);expect(c.national.costs.rent).toBe(0);});
 it('지역 기준은 경북 참외 61건에서만 사용한다',()=>{const eligible=DATA.crops.flatMap(c=>Object.values(c.regions).filter(r=>r.eligible));expect(eligible).toHaveLength(1);expect(eligible[0]).toMatchObject({region:'경상북도',crop:'시설참외',cohortSize:61,top10Count:7});});
 it('모든 카테고리 중앙값이 유한한 음수 아닌 수이다',()=>{for(const c of DATA.crops)for(const b of [c.national,...Object.values(c.regions)]){for(const category of CATEGORIES){expect(Number.isFinite(b.costs[category.key])).toBe(true);expect(b.costs[category.key]).toBeGreaterThanOrEqual(0);}expect(b.top10Count).toBeGreaterThanOrEqual(Math.ceil(b.cohortSize*.1));}});
 it('전국 동일 작목은 모두 50건 이상이며 제주 선택은 전국으로 전환한다',()=>{for(const c of DATA.crops){expect(c.national.eligible).toBe(true);expect(resolveBenchmark(c,'제주특별자치도').fallback).toBe(true);}});
});
