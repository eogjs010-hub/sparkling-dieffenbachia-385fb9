'use client';
import { useEffect, useState } from 'react';
export default function AccessibilityControls(){
 const [large,setLarge]=useState(false);const[contrast,setContrast]=useState(false);
 useEffect(()=>{document.documentElement.classList.toggle('large-text',large);document.documentElement.classList.toggle('high-contrast',contrast);return()=>{document.documentElement.classList.remove('large-text','high-contrast');};},[large,contrast]);
 return <div className="accessibility-controls" aria-label="화면 보기 설정"><button type="button" aria-pressed={large} onClick={()=>setLarge(v=>!v)}>{large?'큰 글씨 켜짐 · 기본 크기로':'큰 글씨 보기'}</button><button type="button" aria-pressed={contrast} onClick={()=>setContrast(v=>!v)}>고대비 보기</button></div>;
}
