'use client';
import {useEffect,useRef,useState} from 'react';
import {CATEGORIES,formatMoney,type Benchmark} from '@/lib/farm';
import {EASY_NAMES} from '@/lib/easy';
import {COST_CHECKS} from '@/lib/resources';
import type {Diagnosis} from './session';
export default function ResultPrint({input,benchmark,label}:{input:Diagnosis;benchmark:Benchmark;label:string}){
 const [preparing,setPreparing]=useState(false);
 const restore=useRef<(()=>void)|null>(null);
 function prepare(){
  if(restore.current)return;
  const root=document.querySelector('.precision-results');
  if(!root)return;
  const details=[...root.querySelectorAll<HTMLDetailsElement>('details')];
  const states=details.map(el=>el.open);
  details.forEach(el=>{el.open=true;});
  document.documentElement.classList.add('printing-report');
  restore.current=()=>{details.forEach((el,i)=>{el.open=states[i];});document.documentElement.classList.remove('printing-report');restore.current=null;};
 }
 useEffect(()=>{
  const after=()=>{restore.current?.();setPreparing(false);};
  window.addEventListener('beforeprint',prepare);
  window.addEventListener('afterprint',after);
  return()=>{window.removeEventListener('beforeprint',prepare);window.removeEventListener('afterprint',after);restore.current?.();};
 },[]);
 async function print(){
  setPreparing(true);prepare();
  try{
   await document.fonts?.ready;
   // Let ResponsiveContainer observe the paper width before opening print preview.
   await Promise.race([new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))),new Promise(resolve=>setTimeout(resolve,250))]);
   await new Promise(resolve=>setTimeout(resolve,200));
   window.print();
  }finally{restore.current?.();setPreparing(false);}
 }
 return <><button type="button" className="secondary-button print-button" disabled={preparing} onClick={print}>{preparing?'인쇄 준비 중…':input.mode==='precision'?'그래프·표 포함 전체 결과 인쇄':'큰 글씨 결과 인쇄'}</button><section className="print-summary"><h1>팜 다이어트 · 비용 점검 요약</h1>{input.sample&&<p>예시 데이터 · 실제 농장 금액이 아닙니다.</p>}<p>{input.crop} · 입력 지역 {input.region} · 재배면적 {input.area.toLocaleString()}평</p><p>비교 기준: {label} {benchmark.region} · 유효 조사표 {benchmark.cohortSize}건 · 상위군 {benchmark.top10Count}건</p><p>아래 금액은 모두 300평 기준입니다. 매출: {formatMoney(input.revenue)}</p><table><thead><tr><th>항목</th><th>우리 농장</th><th>비교 농가</th></tr></thead><tbody>{CATEGORIES.filter(c=>input.selected.includes(c.key)).map(c=><tr key={c.key}><th>{EASY_NAMES[c.key]}</th><td>{formatMoney(input.costs[c.key])}</td><td>{formatMoney(benchmark.costs[c.key])}</td></tr>)}</tbody></table><p>제외한 비용: {CATEGORIES.filter(c=>!input.selected.includes(c.key)).map(c=>c.label).join(', ')||'없음'}. 미입력·제외 비용은 추정하지 않습니다.</p><h2>먼저 확인할 일</h2><ul>{input.selected.slice(0,3).map(k=><li key={k}>{COST_CHECKS[k]}</li>)}</ul><p>비교 차액은 절감 가능액이 아닙니다. 재배 환경·생산량·매출과 함께 확인하세요. 이 결과는 공식 순수익이나 미래 수익 예측이 아닙니다.</p></section></>;}
