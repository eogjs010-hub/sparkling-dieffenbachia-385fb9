'use client';
import { useEffect, useRef, useState } from 'react';
import { koreanMoney, MAX_MONEY, moneyInputText, parseMoneyInput, type MoneyUnit } from '@/lib/money';

export default function MoneyInput({id,label,value,onChange,hint,unit}:{id:string;label:string;value:string;onChange:(value:string)=>void;hint?:string;unit:MoneyUnit}) {
  const [text,setText]=useState(()=>moneyInputText(value,unit));
  const [error,setError]=useState('');
  const sent=useRef(value);const lastUnit=useRef(unit);
  useEffect(()=>{if(value!==sent.current||unit!==lastUnit.current){sent.current=value;lastUnit.current=unit;setText(moneyInputText(value,unit));setError('');}},[value,unit]);
  const amount=Number(value||0);
  function change(next:string){setText(next);try{const parsed=parseMoneyInput(next,unit);sent.current=parsed;onChange(parsed);setError('');}catch(e){sent.current='';onChange('');setError((e as Error).message);}}
  return <div className="field"><label htmlFor={id}>{label}</label>{hint&&<p className="field-hint" id={`${id}-hint`}>{hint}</p>}<div className="unit-input"><input id={id} inputMode={unit==='manwon'?'decimal':'numeric'} autoComplete="off" value={text} placeholder="0" aria-invalid={!!error} aria-describedby={[hint?`${id}-hint`:'',`${id}-reading`,error?`${id}-error`:''].filter(Boolean).join(' ')} onChange={e=>change(e.target.value)}/><span>{unit==='manwon'?'만 원':'원'}</span></div><output id={`${id}-reading`} htmlFor={id} className="money-reading" aria-live="polite">{value===''?'금액을 입력해주세요.':`${koreanMoney(amount)}을 입력하셨습니다. 맞나요?`}</output><div className="money-quick" aria-label={`${label} 빠른 금액 입력`}>{[[100000,'10만'],[1000000,'100만'],[10000000,'1,000만']].map(([increment,title])=><button key={increment} type="button" aria-label={`${label}에 ${title} 원 더하기`} disabled={amount+Number(increment)>MAX_MONEY} onClick={()=>{onChange(String(amount+Number(increment)));setError('');}}>+{title} 원</button>)}</div>{error&&<p id={`${id}-error`} className="input-error" role="alert">{error}</p>}</div>;
}
