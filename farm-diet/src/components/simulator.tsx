'use client';
import { useEffect,useRef,useState } from 'react';
import { flushSync } from 'react-dom';
import { RotateCcw,SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, emptyCosts, formatMoney, simulate, type Costs } from '@/lib/farm';
type ToolContext={registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>unknown};
export default function Simulator({revenue,costs}:{revenue:number;costs:Costs}){
 const [changes,setChanges]=useState(emptyCosts);const result=simulate(revenue,costs,changes);const latest=useRef({revenue,costs,changes});latest.current={revenue,costs,changes};
 useEffect(()=>{
  const context=(document as Document&{modelContext?:ToolContext}).modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const properties=Object.fromEntries(CATEGORIES.map(c=>[c.key,{type:'integer',minimum:-30,maximum:30}]));
  try{void Promise.resolve(context.registerTool({name:'set_cost_scenario',title:'비용 변경 시나리오 설정',description:'현재 정밀 진단의 비용 변경률을 일괄 설정합니다. 지정하지 않은 항목은 현재 값을 유지합니다. 입력 농장 데이터는 서버로 보내지 않습니다.',inputSchema:{type:'object',properties:{changes:{type:'object',properties,additionalProperties:false}},required:['changes'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){
   if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='changes'))throw new Error('changes 객체가 필요합니다.');
   const patch=(input as {changes?:unknown}).changes;if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new Error('변경률 객체가 필요합니다.');
   const next={...latest.current.changes};for(const [key,value]of Object.entries(patch)){if(!CATEGORIES.some(c=>c.key===key)||typeof value!=='number'||!Number.isInteger(value)||Math.abs(value)>30)throw new Error('알 수 없는 항목 또는 변경률 범위 오류');next[key as keyof Costs]=value;}
   const computed=simulate(latest.current.revenue,latest.current.costs,next);flushSync(()=>setChanges(next));return {changes:next,balance:computed.balance,delta:computed.delta,revenueRate:computed.revenueRate};
  }},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return()=>lifecycle.abort();
 },[]);
 return <section className="panel simulator"><div className="panel-heading"><div><span className="mode-icon compact"><SlidersHorizontal size={21}/></span><h2>비용을 바꾸면 어떻게 될까요?</h2></div><button type="button" className="secondary-button" onClick={()=>setChanges(emptyCosts())}><RotateCcw size={16}/>초기화</button></div><p className="muted">현재 매출이 유지된다는 가정 아래 비용 변화만 반영합니다. 실제 미래 수익을 예측하는 모델이 아닙니다.</p><div className="simulation-summary" aria-live="polite"><div><span>현재 추정 잔여액</span><strong>{formatMoney(revenue-simulate(revenue,costs,emptyCosts()).total)}</strong></div><div><span>변경 후 추정 잔여액</span><strong data-testid="projected-balance">{formatMoney(result.balance)}</strong></div><div><span>잔여액 증감</span><strong className={result.delta<0?'negative':'positive'} data-testid="balance-delta">{result.delta>0?'+':''}{formatMoney(result.delta)}</strong><small>변경 후 잔여액 / 매출: {result.revenueRate===null?'계산 불가':`${result.revenueRate.toFixed(1)}%`}</small></div></div><div className="slider-grid">{CATEGORIES.map(c=><div className="slider-field" key={c.key}><div className="slider-label"><label htmlFor={`slider-${c.key}`}>{c.label}</label><output htmlFor={`slider-${c.key}`}>{changes[c.key]>0?'+':''}{changes[c.key]}%</output></div><input type="range" id={`slider-${c.key}`} min={-30} max={30} step={1} value={changes[c.key]} aria-valuetext={`${changes[c.key]}퍼센트`} onChange={e=>setChanges(v=>({...v,[c.key]:Number(e.target.value)}))}/><div className="slider-scale"><span>−30%</span><span>0%</span><span>+30%</span></div><p>{formatMoney(costs[c.key])} <span>→</span> {formatMoney(result.adjusted[c.key])}</p></div>)}</div><div className="notice"><p>감가상각비·기회비용의 감소는 현금 지출 절감과 다릅니다. 비용 감소로 생산량이나 매출이 달라지는 효과는 반영하지 않습니다.</p></div></section>;
}
