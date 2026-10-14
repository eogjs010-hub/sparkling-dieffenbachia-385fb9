'use client';
import {CATEGORIES,formatMoney,gap,type Benchmark} from '@/lib/farm';
import {EASY_NAMES} from '@/lib/easy';
import {COST_CHECKS} from '@/lib/resources';
import type {Diagnosis} from './session';
import ReadAloud from './read-aloud';

export default function SimpleFeedback({input,benchmark,valueLabel}:{input:Diagnosis;benchmark:Benchmark;valueLabel:string}){
 const rows=CATEGORIES.filter(c=>input.selected.includes(c.key)).map(c=>({...c,...gap(input.costs[c.key],benchmark.costs[c.key])}));
 const first=[...rows].sort((a,b)=>(b.pct??-Infinity)-(a.pct??-Infinity))[0];
 const headline=first?.status==='high'?`${EASY_NAMES[first.key]}부터 점검해보세요.`:'비용 차이와 재배 조건을 함께 확인해보세요.';
 const actions=[first?COST_CHECKS[first.key]:'비용 장부와 영수증을 먼저 확인하세요.','금액이 같은 기간·작물 기준인지 장부와 영수증으로 확인하세요.','비용이 적은 항목도 생산량·품질·매출이 유지되는지 확인하세요.'];
 return <section className="simple-feedback"><h2>{headline}</h2><ReadAloud text={`${headline} ${rows.map(row=>`${EASY_NAMES[row.key]}. 300평당 우리 농장 ${formatMoney(input.costs[row.key])}. 비교 농가 ${formatMoney(benchmark.costs[row.key])}.`).join(' ')} 먼저 확인할 일. ${actions.join(' ')}`}/><div className="simple-result-grid">{rows.map(row=>{const user=input.costs[row.key];const target=benchmark.costs[row.key];const max=Math.max(user,target,1);return <section key={row.key} className={`gap-card ${row.status}`}><h3>{EASY_NAMES[row.key]}</h3><p>300평당 우리 농장 <strong>{formatMoney(user)}</strong></p><div className="comparison-track" aria-hidden="true"><span style={{width:`${user/max*100}%`}}/></div><p>비교 농가 <strong>{formatMoney(target)}</strong></p><div className="comparison-track reference" aria-hidden="true"><span style={{width:`${target/max*100}%`}}/></div><p className="gap-amount">우리 농장이 {formatMoney(Math.abs(row.amount))} {row.amount>0?'더 쓰고':row.amount<0?'덜 쓰고':'차이 없이 쓰고'} 있습니다.</p><p>{row.pct===null?'비교 농가 기준이 0원이어서 비율은 비교하기 어렵습니다.':row.status==='high'?'점검할 항목입니다. 사용량·가격·재배 조건을 확인하세요.':row.status==='low'?'비용이 적다고 무조건 좋은 것은 아닙니다. 생산량·매출을 함께 확인하세요.':'비슷한 지출 수준입니다. 생산량·매출도 함께 확인하세요.'}</p><p><strong>먼저 할 일:</strong> {COST_CHECKS[row.key]}</p><p className="small-note">{valueLabel}과의 비교 차액입니다. 이 차액을 그대로 절감할 수 있다는 뜻은 아닙니다.</p></section>;})}</div><div className="panel first-actions"><h2>먼저 확인할 일 3가지</h2><ol>{actions.map(a=><li key={a}>{a}</li>)}</ol></div><details className="helper-guide"><summary>전체 9가지 비용의 비교 여부 보기</summary><ul>{CATEGORIES.map(c=><li key={c.key}>{EASY_NAMES[c.key]}: {input.selected.includes(c.key)?'입력한 금액으로 비교':'비교하지 않음 · 미입력 또는 제외한 금액은 추정하지 않습니다.'}</li>)}</ul></details></section>;
}
