'use client';
import {useEffect,useRef,useState} from 'react';
import {areaInPyeong,PYEONG_M2} from '@/lib/easy';
export default function AreaInput({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const[unit,setUnit]=useState<'pyeong'|'m2'>('pyeong');const[text,setText]=useState(value);const sent=useRef(value);
 useEffect(()=>{if(value!==sent.current){sent.current=value;setText(value===''?'':String(Number(value)*(unit==='m2'?PYEONG_M2:1)));}},[value,unit]);
 return <div className="field"><label htmlFor="area-unit">면적 단위</label><select id="area-unit" value={unit} onChange={e=>{const next=e.target.value as 'pyeong'|'m2';setUnit(next);setText(value===''?'':String(Number((Number(value)*(next==='m2'?PYEONG_M2:1)).toFixed(4))));}}><option value="pyeong">평</option><option value="m2">㎡ (제곱미터)</option></select><label htmlFor="area">해당 작목 총 재배면적</label><div className="unit-input"><input id="area" inputMode="decimal" value={text} onChange={e=>{const v=e.target.value.replaceAll(',','');if(/^\d*\.?\d*$/.test(v)){setText(v);const next=v===''||v==='.'?'':String(areaInPyeong(Number(v),unit));sent.current=next;onChange(next);}}}/><span>{unit==='m2'?'㎡':'평'}</span></div><p>약 {Number(value||0).toLocaleString('ko-KR',{maximumFractionDigits:2})}평 · 1평 ≈ 3.3058㎡</p></div>;
}
