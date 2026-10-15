import { CATEGORIES, MIN_COHORT, type Benchmark, type BenchmarkData, type Costs, type CategoryKey } from './farm';

export type PeriodMode = 'single' | 'recent3' | 'recent5' | 'recent10' | 'custom';
export function comparisonYears(mode: PeriodMode, end: number, start = end): number[] {
  if (mode === 'recent3') start = end - 2;
  if (mode === 'recent5') start = end - 4;
  if (mode === 'recent10') start = end - 9;
  if (mode === 'single') start = end;
  if (![start,end].every(y => Number.isInteger(y) && y >= 2015 && y <= 2024) || start > end) throw new Error('2015~2024년 안에서 시작·종료 연도를 확인해주세요.');
  return Array.from({length:end-start+1},(_,i)=>start+i);
}
const eligible = (b: Benchmark | undefined): b is Benchmark => !!b && b.eligible && b.cohortSize >= MIN_COHORT && b.top10Count >= 5;
const mean = (values: number[]) => values.reduce((n,v)=>n+v,0)/values.length;
export function resolvePeriodBenchmark(data: BenchmarkData[], crop: string, region: string, requestedYears: number[]) {
  if (!requestedYears.length || new Set(requestedYears).size !== requestedYears.length) throw new Error('중복 없는 비교 연도를 선택해주세요.');
  const requested = [...requestedYears].sort((a,b)=>a-b);
  const missingYears: number[]=[]; const insufficientYears: number[]=[];
  const candidates = requested.flatMap(year=>{
    const d=data.find(d=>d.year===year); if(!d) throw new Error('지원하지 않는 조사연도입니다.');
    const c=d.crops.find(c=>c.crop===crop);
    if(!c){missingYears.push(year);return [];}
    if(!eligible(c.national)){insufficientYears.push(year);return [];}
    return [{year,crop:c}];
  });
  if(!candidates.length || (requested.length>1 && candidates.length<2)) throw new Error('선택 기간에서 비교 가능한 표본이 부족합니다. 기간 평균은 유효한 2개년 이상이 필요합니다.');
  const regional = region!=='전국' && candidates.every(c=>eligible(c.crop.regions[region]));
  const cohorts=candidates.map(c=>regional?c.crop.regions[region]:c.crop.national);
  const years=candidates.map(c=>c.year);
  const benchmark: Benchmark = {
    ...cohorts[0], region: regional?region:'전국', cohortSize:cohorts.reduce((n,c)=>n+c.cohortSize,0), top10Count:cohorts.reduce((n,c)=>n+c.top10Count,0), eligible:true,
    costs:Object.fromEntries(CATEGORIES.map(c=>[c.key,mean(cohorts.map(b=>b.costs[c.key]))])) as Costs,
    medianRevenue:mean(cohorts.map(c=>c.medianRevenue)), medianNetProfit:mean(cohorts.map(c=>c.medianNetProfit)), medianNetProfitRate:mean(cohorts.map(c=>c.medianNetProfitRate)), medianOmittedCosts:mean(cohorts.map(c=>c.medianOmittedCosts)),
    cohortMedianCosts:cohorts.every(b=>b.cohortMedianCosts)?Object.fromEntries(CATEGORIES.map(c=>[c.key,mean(cohorts.map(b=>b.cohortMedianCosts![c.key]))])) as Costs:undefined,
    cohortMedianRepairCost:cohorts.every(b=>b.cohortMedianRepairCost!==undefined)?mean(cohorts.map(b=>b.cohortMedianRepairCost!)):undefined,
    cohortMedianTotalCosts:cohorts.every(b=>b.cohortMedianTotalCosts!==undefined)?mean(cohorts.map(b=>b.cohortMedianTotalCosts!)):undefined,
    top10MedianTotalCosts:cohorts.every(b=>b.top10MedianTotalCosts!==undefined)?mean(cohorts.map(b=>b.top10MedianTotalCosts!)):undefined,
  };
  benchmark.top10Share=benchmark.top10Count/benchmark.cohortSize*100;
  const averaged=years.length>1;
  const requestedLabel=requested.length===1?`${requested[0]}년`:`${requested[0]}–${requested.at(-1)}년`;
  const partial=years.length!==requested.length;
  return {benchmark,years,requestedYears:requested,missingYears,insufficientYears,averaged,partial,
    fallback:region!=='전국'&&!regional,
    regionalCount:Math.min(...candidates.map(c=>c.crop.regions[region]?.cohortSize??0)),
    label:averaged?`${requestedLabel}${partial?` 중 ${years.length}개년`:''} 평균`:requestedLabel,
    valueLabel:averaged?'연도별 중앙값 평균':'상위 10% 중앙값',
    method:averaged?'각 연도 순수익률 상위 10%를 따로 선정한 뒤, 연도별 중앙값을 동일 비중으로 평균합니다.':'해당 연도 순수익률 상위 10%의 중앙값입니다.',
  };
}
export type TrendKey = CategoryKey | 'total';
export function costTrend(data: BenchmarkData[], crop: string, region: string, category: TrendKey) {
  return [...data].sort((a,b)=>a.year-b.year).map(d=>{
    const c=d.crops.find(c=>c.crop===crop);
    const b=region==='전국'?c?.national:c?.regions[region];
    const valid=eligible(b);
    return {year:d.year,n:b?.cohortSize??0,topCount:b?.top10Count??0,
      all:valid?(category==='total'?b.cohortMedianTotalCosts??null:b.cohortMedianCosts?.[category]??null):null,
      top:valid?(category==='total'?b.top10MedianTotalCosts??null:b.costs[category]):null,
      reason:!c?'동일 작목명 자료 없음':!b?'지역 표본 없음':!valid?'유효 표본 부족':'',
    };
  });
}
export function trendInsight(points: ReturnType<typeof costTrend>) {
  const valid=points.filter(p=>p.all!==null);
  if(valid.length<2) return '동일 작목명으로 비교할 수 있는 연도가 2개 미만입니다.';
  const first=valid[0],last=valid.at(-1)!;
  if(first.all===0) return `${first.year}년 기준 비용이 0이어서 증감률을 계산하기 어렵습니다.`;
  const pct=(last.all!-first.all!)/first.all!*100;
  const gaps=points.filter(p=>p.year>=first.year&&p.year<=last.year&&p.all===null).length;
  return `${first.year}년 대비 ${last.year}년 전체 조사표 비용 중앙값이 ${Math.abs(pct).toFixed(1)}% ${pct>=0?'증가':'감소'}했습니다.${gaps?' 중간 결측 연도는 연결하지 않았습니다.':''} 물가와 조사표 구성 변화도 함께 확인하세요.`;
}
