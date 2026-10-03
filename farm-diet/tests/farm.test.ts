import { describe, it, expect } from 'vitest';
import { CATEGORIES, calculateNineCategories, emptyCosts, gap, median, netProfitRate, numeric, resolveBenchmark, selectTop10, simulate, standardizeTo300, type Benchmark, type CropBenchmark } from '../src/lib/farm';

describe('300평 표준화', () => {
  it('1000평 비용 1000만원을 300만원으로 환산한다', () => expect(standardizeTo300(10_000_000, 1000)).toBe(3_000_000));
  it('300평 원본 값은 그대로 유지한다', () => expect(standardizeTo300(123456, 300)).toBe(123456));
  it.each([0,-10,NaN,Infinity])('잘못된 면적 %s를 거부한다', area => expect(() => standardizeTo300(100, area)).toThrow());
  it('음수 금액을 거부하고 실제 0은 허용한다', () => { expect(() => standardizeTo300(-1,300)).toThrow(); expect(standardizeTo300(0,300)).toBe(0); });
});
describe('중앙값과 상위 10%', () => {
  it('정렬되지 않은 홀수·짝수 표본과 극단값을 처리한다', () => { expect(median([1000000,3,1,2,4])).toBe(3); expect(median([4,1,3,2])).toBe(2.5); });
  it('빈 표본을 거부한다', () => expect(() => median([])).toThrow());
  it('104건 중 11건을 선정하고 원본 순서를 유지한다', () => { const r = Array.from({length:104},(_,i)=>({rate:i})); expect(selectTop10(r)).toHaveLength(11); expect(selectTop10(r)[0].rate).toBe(103); expect(r[0].rate).toBe(0); });
  it('경계 동점은 모두 포함한다', () => expect(selectTop10([{rate:9},{rate:9},...Array.from({length:8},()=>({rate:1}))])).toHaveLength(2));
  it('비용 크기가 아니라 순수익률을 사용한다', () => { expect(netProfitRate(-50,100)).toBe(-50); expect(netProfitRate(50,100)).toBe(50); expect(() => netProfitRate(5,0)).toThrow(); });
});
describe('실제 헤더에 따른 9대 비용 매핑', () => {
  const row = Object.fromEntries(CATEGORIES.flatMap(c=>c.fields.map(f=>[f,100])));
  it('9개 항목의 구성요소를 정확히 더한다', () => expect(calculateNineCategories(row)).toEqual({seed:100,fertilizer:200,pest:100,energy:100,materials:100,maintenance:300,labor:200,rent:200,opportunity:400}));
  it('세부비·임차료 집계·노임단가를 중복 합산하지 않는다', () => {
    expect(calculateNineCategories({...row,'종자_구입_비용':999999,'종묘_구입_비용':999999,'영양제_비용':999999,'임차료_비용':999999,'임차료(대농기구)_비용':999999,'자가노동비(남)_비용':999999})).toEqual(calculateNineCategories(row));
  });
  it('미검증 결측은 실패하고 검증된 0 가정만 허용한다', () => { expect(()=>calculateNineCategories({...row,'농약비_비용':null})).toThrow(); expect(calculateNineCategories({...row,'농약비_비용':null},true).pest).toBe(0); });
  it('숫자 변환은 빈칸과 0을 구분한다', () => { expect(numeric(' ')).toBeNull(); expect(numeric('0')).toBe(0); expect(numeric('1,234')).toBe(1234); expect(numeric('오류')).toBeNull(); });
});
describe('Gap 및 레이더 지수', () => {
  it('146만원과 120만원의 차이를 계산한다', () => { const r=gap(1460000,1200000); expect(r.amount).toBe(260000); expect(r.pct).toBeCloseTo(21.6667,3); expect(r.status).toBe('high'); });
  it('0 벤치마크는 백분율·지수 모두 null이다',()=>expect(gap(100,0)).toMatchObject({pct:null,index:null,status:'unavailable'}));
  it('낮은 비용은 우수 판정 대신 낮은 투입 상태다',()=>expect(gap(50,100).status).toBe('low'));
  it('±15% 경계는 비슷한 수준이다',()=>{expect(gap(115,100).status).toBe('similar');expect(gap(85,100).status).toBe('similar');});
});
describe('What-if',()=>{
  it('비용 10% 절감 시 고정 매출에서 잔여액이 늘어난다',()=>{const costs=emptyCosts();costs.energy=1000;const changes=emptyCosts();changes.energy=-10;const result=simulate(2000,costs,changes);expect(result).toMatchObject({total:900,balance:1100,delta:100});expect(result.revenueRate).toBeCloseTo(55);});
  it('기본 0%는 변화가 없고 변경 범위 밖은 거부한다',()=>{const costs=emptyCosts();costs.labor=100;expect(simulate(200,costs,emptyCosts()).delta).toBe(0);const changes=emptyCosts();changes.rent=31;expect(()=>simulate(200,costs,changes)).toThrow();});
  it('매출 0의 비율은 null이고 음수 잔여액은 허용한다',()=>{const costs=emptyCosts();costs.energy=100;expect(simulate(0,costs,emptyCosts())).toMatchObject({balance:-100,revenueRate:null});});
});
describe('지역 fallback',()=>{
  const benchmark=(n:number, region:string):Benchmark=>({crop:'시설참외',region,cohortSize:n,top10Count:Math.ceil(n*.1),top10Share:10,eligible:n>=50,medianRevenue:100,medianNetProfit:50,medianNetProfitRate:50,medianOmittedCosts:0,costs:emptyCosts()});
  const crop:CropBenchmark={crop:'시설참외',national:benchmark(86,'전국'),regions:{'경상북도':benchmark(61,'경상북도'),'경기도':benchmark(13,'경기도')}};
  it('50건 이상 지역을 사용한다',()=>expect(resolveBenchmark(crop,'경상북도').fallback).toBe(false));
  it('작은 지역·없는 지역은 전국으로 전환한다',()=>{expect(resolveBenchmark(crop,'경기도')).toMatchObject({fallback:true,regionalCount:13});expect(resolveBenchmark(crop,'제주특별자치도').benchmark.region).toBe('전국');});
  it('전국도 50건 미만이면 비교를 보류한다',()=>expect(()=>resolveBenchmark({...crop,national:benchmark(49,'전국')},'전국')).toThrow());
});
