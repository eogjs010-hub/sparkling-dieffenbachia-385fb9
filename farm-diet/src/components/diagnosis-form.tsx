'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Info, FlaskConical, ShieldCheck } from 'lucide-react';
import { DATA, REGIONS } from '@/lib/benchmarks';
import { CATEGORIES, emptyCosts, numeric, standardizeTo300, formatMoney, type CategoryKey } from '@/lib/farm';
import { useSession, type Draft, type Mode } from './session';

const hints:Record<CategoryKey,string>={seed:'구입비와 자가 생산 종자·종묘의 평가액',fertilizer:'유기질·무기질 비료와 영양제의 합계',pest:'농약과 병해충 방제 제재의 합계',energy:'수도료·전기·연료 비용의 합계',materials:'비닐·상토·수정벌·포장재 등의 작목 부담비',maintenance:'수리유지비와 해당 기간 감가상각비',labor:'고용노동비와 외부 위탁영농비',rent:'농기계·시설 임차료와 토지 임차료',opportunity:'자가노동·자가토지·자본 사용의 평가비용'};
const moneyText = (s:string) => s ? Number(s).toLocaleString('ko-KR') : '';
function MoneyInput({id,label,value,onChange,hint}:{id:string;label:string;value:string;onChange:(value:string)=>void;hint?:string}) {
 return <div className="field"><label htmlFor={id}>{label}</label>{hint&&<p className="field-hint" id={`${id}-hint`}>{hint}</p>}<div className="unit-input"><input id={id} inputMode="numeric" autoComplete="off" value={moneyText(value)} placeholder="0" aria-describedby={hint?`${id}-hint`:undefined} onChange={e=>onChange(e.target.value.replace(/[^0-9]/g,'').slice(0,13))}/><span>원</span></div></div>;
}
export default function DiagnosisForm({mode}:{mode:Mode}) {
 const {drafts,updateDraft,save}=useSession();const draft=drafts[mode];const router=useRouter();const [error,setError]=useState('');
 const update=(patch:Partial<Draft>)=>{updateDraft(mode,{...draft,...patch,sample:false});setError('');};
 const setCost=(key:CategoryKey,value:string)=>update({costs:{...draft.costs,[key]:value}});
 function sample(){
  const benchmark=DATA.crops.find(c=>c.crop===draft.crop)!.national;const costs={...draft.costs};
  CATEGORIES.forEach(c=>{costs[c.key]=String(Math.round(benchmark.costs[c.key]*1000/300*(c.key==='energy'?1.22:c.key==='fertilizer'?.8:1)));});
  updateDraft(mode,{...draft,area:'1000',revenue:String(Math.round(benchmark.medianRevenue*1000/300)),costs,sample:true});setError('');
 }
 function submit(e:React.FormEvent){e.preventDefault();try{
  const area=numeric(draft.area);const revenue=numeric(draft.revenue);
  if(area===null||area<=0||area>100000000)throw new Error('해당 작목의 재배면적을 0보다 큰 값으로 입력해주세요.');
  if(revenue===null||revenue<0)throw new Error('해당 작목의 매출을 입력해주세요. 매출이 없으면 0을 입력할 수 있습니다.');
  if(!DATA.crops.some(c=>c.crop===draft.crop)||!REGIONS.includes(draft.region))throw new Error('지역과 작목을 확인해주세요.');
  if(mode==='simple'&&draft.first===draft.second)throw new Error('두 지출 항목을 서로 다르게 선택해주세요.');
  const selected=mode==='simple'?[draft.first,draft.second]:CATEGORIES.map(c=>c.key);const costs=emptyCosts();
  for(const key of selected){const v=numeric(draft.costs[key]);if(v===null||v<0)throw new Error(`${CATEGORIES.find(c=>c.key===key)!.label} 금액을 입력해주세요. 지출이 없으면 0을 입력하세요.`);costs[key]=standardizeTo300(v,area);}
  save({mode,crop:draft.crop,region:draft.region,area,revenue:standardizeTo300(revenue,area),costs,selected,sample:draft.sample});
  router.push(`/result/${mode}/`);
 }catch(e){setError((e as Error).message);}}
 const precise=mode==='precision';
 return <main id="main" className="shell flow-page"><div className="flow-heading"><Link href="/" className="text-link">모드 선택</Link><div className="steps" aria-label="진단 진행 단계"><span className="active">01 정보 입력</span><span>02 비교 결과</span></div><span className="eyebrow">{precise?'정밀 진단':'간편 진단'}</span><h1>{precise?'비용 구조를 자세히 살펴볼까요?':'큰 지출부터 가볍게 점검해요.'}</h1><p>아래 금액은 환산 전 농장 금액으로 입력하세요. 300평 기준으로 자동 계산합니다.</p></div><form onSubmit={submit} noValidate><section className="panel"><div className="panel-heading"><div><span className="section-number">01</span><h2>내 농장 정보</h2></div><button type="button" className="secondary-button sample-button" onClick={sample}><FlaskConical size={17}/>예시로 살펴보기</button></div><div className="notice"><Info size={19}/><p><strong>비교하는 작목에 해당하는 면적·매출·비용을 입력하세요.</strong> 여러 작목이 함께 쓰는 시설·노동 비용은 해당 작목의 몫으로 나눠주세요. 비교 기간도 같은 기준으로 맞춰야 합니다.</p></div>{draft.sample&&<p className="sample-notice" role="status">예시 금액을 불러왔습니다. 실제 농장 진단에는 본인의 금액으로 바꿔주세요.</p>}<div className="field-grid"><div className="field"><label htmlFor="region">지역</label><select id="region" value={draft.region} onChange={e=>update({region:e.target.value})}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></div><div className="field"><label htmlFor="crop">작목</label><select id="crop" value={draft.crop} onChange={e=>update({crop:e.target.value})}>{DATA.crops.map(c=><option key={c.crop}>{c.crop}</option>)}</select></div><div className="field"><label htmlFor="area">해당 작목 총 재배면적</label><p className="field-hint">농장 전체가 아닌, 선택한 작목의 면적</p><div className="unit-input"><input id="area" inputMode="decimal" autoComplete="off" placeholder="예: 1,000" value={draft.area} onChange={e=>{const clean=e.target.value.replace(/[^0-9.]/g,'');if(/^\d*\.?\d*$/.test(clean))update({area:clean.slice(0,12)});}}/><span>평</span></div></div><MoneyInput id="revenue" label="해당 작목 연간 매출" hint="조사대상 기간과 동일한 범위의 매출" value={draft.revenue} onChange={revenue=>update({revenue})}/></div><p className="inline-note"><ShieldCheck size={16}/>입력값은 이 브라우저의 현재 화면에서만 사용합니다. 새로고침하면 초기화됩니다.</p></section><section className="panel"><div className="panel-heading"><div><span className="section-number">02</span><h2>{precise?'9대 비용 입력':'가장 큰 지출 두 가지'}</h2></div><span className="muted">단위: 원</span></div><p className="muted">{precise?'지출이 없으면 0을 입력하세요. 기회비용·감가상각비는 현금 지출과 구분해 평가합니다.':'두 항목만 비교합니다. 입력하지 않은 비용이나 전체 수익은 추정하지 않습니다.'}</p>{precise?<div className="cost-grid">{CATEGORIES.map((c,i)=><div className="cost-field" key={c.key}><span className="cost-number">{String(i+1).padStart(2,'0')}</span><MoneyInput id={`cost-${c.key}`} label={c.label} hint={hints[c.key]} value={draft.costs[c.key]} onChange={v=>setCost(c.key,v)}/></div>)}</div>:<div className="simple-input-grid">{(['first','second'] as const).map((slot,i)=><div className="simple-input-card" key={slot}><label htmlFor={`category-${slot}`}>큰 지출 항목 {i+1}</label><select id={`category-${slot}`} value={draft[slot]} onChange={e=>update({[slot]:e.target.value as CategoryKey})}>{CATEGORIES.map(c=><option key={c.key} value={c.key} disabled={c.key===draft[slot==='first'?'second':'first']}>{c.label}</option>)}</select><MoneyInput id={`cost-${slot}`} label={`항목 ${i+1} 금액`} value={draft.costs[draft[slot]]} onChange={v=>setCost(draft[slot],v)} hint={hints[draft[slot]]}/></div>)}</div>}</section>{error&&<div role="alert" className="error-message">{error}</div>}<div className="submit-row"><span>2024년 동일 작목 상위군과 비교합니다.</span><button className="primary-button" type="submit">{precise?'정밀 분석 결과 보기':'간편 진단 결과 보기'}</button></div></form><p className="source-note">{DATA.quality.validRows.toLocaleString()}개 유효 조사표 · {DATA.quality.cropCount}개 작목 · 비용은 300평 기준</p></main>;
}
