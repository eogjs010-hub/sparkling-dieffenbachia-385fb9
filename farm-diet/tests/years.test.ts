import { describe, expect, it } from 'vitest';
import { YEARS, getYearData } from '../src/lib/benchmarks';
import { categoriesForYear, calculateNineCategories, resolveBenchmark } from '../src/lib/farm';

describe('2015–2024 연도별 실제 데이터', () => {
  it('10개 연도를 모두 제공하며 잘못된 연도는 거부한다', () => {
    expect(YEARS).toEqual([2024,2023,2022,2021,2020,2019,2018,2017,2016,2015]);
    expect(() => getYearData(2014)).toThrow();
  });
  it.each(YEARS)('%i년 코호트 수·회계 검증 및 매핑을 보존한다', year => {
    const data = getYearData(year);
    expect(data.year).toBe(year);
    expect(data.baseAreaPyeong).toBe(300);
    expect(data.quality.rawRows).toBe(data.quality.validRows + data.quality.excludedRows);
    expect(data.crops.reduce((n,c) => n+c.national.cohortSize,0)).toBe(data.quality.validRows);
    expect(data.quality.validRows).toBeGreaterThan(900);
    const fields=categoriesForYear(year).flatMap(c=>c.fields);
    expect(new Set(fields).size).toBe(fields.length);
    for(const crop of data.crops) {
      expect(crop.national.top10Count).toBeGreaterThanOrEqual(Math.ceil(crop.national.cohortSize*.1));
      if(crop.national.eligible) expect(resolveBenchmark(crop,'제주특별자치도').benchmark).toBe(crop.national);
    }
  });
  it('2015년 구 광열동력비와 수도료를 합하고 임차료 집계만 사용한다', () => {
    const row=Object.fromEntries(categoriesForYear(2015).flatMap(c=>c.fields.map(f=>[f,100])));
    const costs=calculateNineCategories({...row,'수도광열비_비용':9999,'임차료(농기계시설)_비용':9999,'임차_조사작목_부담비용':9999},false,2015);
    expect(costs.energy).toBe(200);expect(costs.rent).toBe(100);
    expect(getYearData(2015).quality.uniqueFarmCount).toBeNull();
  });
  it('2016년 임차료는 원본 집계만 사용하며 농기계 세부 비용을 중복 합산하지 않는다', () => {
    const row=Object.fromEntries(categoriesForYear(2016).flatMap(c=>c.fields.map(f=>[f,100])));
    expect(calculateNineCategories({...row,'임차료(농기계시설)_비용':300,'임차_조사작목_부담비용':500},false,2016).rent).toBe(100);
  });
});
