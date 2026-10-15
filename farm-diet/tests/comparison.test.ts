import { describe, expect, it } from 'vitest';
import { comparisonYears, costTrend, resolvePeriodBenchmark, trendInsight } from '../src/lib/comparison';
import { emptyCosts, type Benchmark, type BenchmarkData } from '../src/lib/farm';
import { YEAR_DATA } from '../src/lib/benchmarks';
import { koreanMoney, moneyInputText, parseMoneyInput } from '../src/lib/money';

const benchmark=(value:number,n=50,region='전국'):Benchmark=>({crop:'시설참외',region,cohortSize:n,top10Count:Math.ceil(n/10),top10Share:10,eligible:n>=50,medianRevenue:value*10,medianNetProfit:value*5,medianNetProfitRate:value,medianOmittedCosts:0,costs:{...emptyCosts(),energy:value},cohortMedianCosts:{...emptyCosts(),energy:value*2},cohortMedianRepairCost:value*4,cohortMedianTotalCosts:value*3,top10MedianTotalCosts:value*2});
const data=(year:number,value:number,n=50):BenchmarkData=>({year,baseAreaPyeong:300,minCohortSize:50,regions:['경상북도'],quality:{rawRows:n,validRows:n,excludedRows:0,uniqueFarmCount:n,cropCount:1,blankCostCellsVerifiedAsZero:0,exclusions:[],policy:[]},crops:[{crop:'시설참외',national:benchmark(value,n),regions:{경상북도:benchmark(value/2,n,'경상북도')}}]});
describe('기간 비교와 실제 시계열',()=>{
 it('최근 자료 3·5·10년과 직접 선택 구간을 계산한다',()=>{expect(comparisonYears('recent3',2024)).toEqual([2022,2023,2024]);expect(comparisonYears('recent5',2024)).toHaveLength(5);expect(comparisonYears('recent10',2024)).toHaveLength(10);expect(comparisonYears('custom',2020,2018)).toEqual([2018,2019,2020]);expect(()=>comparisonYears('custom',2018,2020)).toThrow();});
 it('연도별 중앙값은 표본 수에 상관없이 같은 비중으로 평균한다',()=>{const r=resolvePeriodBenchmark([data(2023,10,50),data(2024,30,100)],'시설참외','전국',[2023,2024]);expect(r.benchmark.costs.energy).toBe(20);expect(r.benchmark.medianNetProfitRate).toBe(20);expect(r.benchmark.cohortMedianCosts?.energy).toBe(40);expect(r.benchmark.cohortMedianTotalCosts).toBe(60);expect(r.benchmark.cohortSize).toBe(150);expect(r.averaged).toBe(true);});
 it('단일 연도는 기존 중앙값과 같고 지역 기준을 유지한다',()=>expect(resolvePeriodBenchmark([data(2024,30)],'시설참외','경상북도',[2024]).benchmark.costs.energy).toBe(15));
 it('한 연도라도 지역 표본이 부족하면 전체 기간을 전국으로 전환한다',()=>{const a=data(2023,10);a.crops[0].regions.경상북도=benchmark(5,49,'경상북도');const r=resolvePeriodBenchmark([a,data(2024,30)],'시설참외','경상북도',[2023,2024]);expect(r.fallback).toBe(true);expect(r.benchmark.costs.energy).toBe(20);expect(r.benchmark.region).toBe('전국');});
 it('자료 없는 해와 표본 부족은 0으로 채우지 않고 사용 연도를 밝힌다',()=>{const a=data(2021,1);a.crops=[];const r=resolvePeriodBenchmark([a,data(2022,1000,49),data(2023,10),data(2024,30)],'시설참외','전국',[2021,2022,2023,2024]);expect(r.missingYears).toEqual([2021]);expect(r.insufficientYears).toEqual([2022]);expect(r.years).toEqual([2023,2024]);expect(r.partial).toBe(true);expect(r.benchmark.costs.energy).toBe(20);});
 it('기간 평균에 한 해만 있으면 비교를 보류한다',()=>expect(()=>resolvePeriodBenchmark([data(2023,10,49),data(2024,30)],'시설참외','전국',[2023,2024])).toThrow());
 it('잘못된 연도·중복 연도·없는 작목을 거부한다',()=>{const a=[data(2024,10)];expect(()=>resolvePeriodBenchmark(a,'시설참외','전국',[2024,2024])).toThrow();expect(()=>resolvePeriodBenchmark(a,'시설참외','전국',[2014])).toThrow();expect(()=>resolvePeriodBenchmark(a,'시설오이','전국',[2024])).toThrow();});
 it('추이의 결측은 null이며 합계는 조사표별 합계의 중앙값이다',()=>{const a=data(2023,10,49);const points=costTrend([a,data(2024,30)],'시설참외','전국','total');expect(points[0].all).toBeNull();expect(points[1].all).toBe(90);expect(points[1].top).toBe(60);});
 it('0 기준에서는 증감률을 계산하지 않는다',()=>{expect(trendInsight(costTrend([data(2023,0),data(2024,20)],'시설참외','전국','energy'))).toContain('0이어서');});
 it('전체 기간 자료의 9대 비용·합계 중앙값이 유한하다',()=>{for(const d of YEAR_DATA)for(const c of d.crops)for(const b of [c.national,...Object.values(c.regions)]){expect(b.cohortMedianTotalCosts).toBeGreaterThanOrEqual(0);expect(b.top10MedianTotalCosts).toBeGreaterThanOrEqual(0);expect(Object.values(b.cohortMedianCosts!).every(Number.isFinite)).toBe(true);}});
});
describe('입력 단위와 한글 금액',()=>{
 it('만원 입력·소수 입력을 원으로 변환한다',()=>{expect(parseMoneyInput('1,500','manwon')).toBe('15000000');expect(parseMoneyInput('1.0001','manwon')).toBe('10001');expect(parseMoneyInput('15,000,000','won')).toBe('15000000');expect(moneyInputText('15000000','manwon')).toBe('1,500');});
 it('빈칸과 0을 구분하고 음수·초과·소수 자릿수를 거부한다',()=>{expect(parseMoneyInput('','manwon')).toBe('');expect(parseMoneyInput('0','manwon')).toBe('0');expect(()=>parseMoneyInput('-10','manwon')).toThrow();expect(()=>parseMoneyInput('1.00001','manwon')).toThrow();expect(()=>parseMoneyInput('999999999999999','won')).toThrow();});
 it('천·백·만·억 단위 금액을 정확히 읽는다',()=>{expect(koreanMoney(15000000)).toBe('1,500만원');expect(koreanMoney(100000)).toBe('10만원');expect(koreanMoney(100000000)).toBe('1억원');expect(koreanMoney(0)).toBe('0원');});
});

it('금액은 만 단위로 묶고 잔여 원을 생략하지 않는다',()=>{expect(koreanMoney(2488717)).toBe('248만 8,717원');expect(koreanMoney(100000001)).toBe('1억 1원');expect(koreanMoney(9999)).toBe('9,999원');expect(koreanMoney(9999999999999)).toBe('9조 9,999억 9,999만 9,999원');});

it('수리유지비 참고값도 표본 수 가중 없이 연도별 중앙값을 평균한다',()=>{const r=resolvePeriodBenchmark([data(2023,10,50),data(2024,30,100)],'시설참외','전국',[2023,2024]);expect(r.benchmark.cohortMedianRepairCost).toBe(80);});
