'use client';
import { createContext, useContext, useState } from 'react';
import { emptyCosts, type CategoryKey, type Costs } from '@/lib/farm';
export type Mode = 'simple' | 'precision';
export type Draft = { crop: string; region: string; area: string; revenue: string; first: CategoryKey; second: CategoryKey; costs: Record<CategoryKey,string>; sample: boolean };
export type Diagnosis = { mode: Mode; crop: string; region: string; area: number; revenue: number; costs: Costs; selected: CategoryKey[]; sample: boolean };
const newDraft = (): Draft => ({ crop: '시설수박', region: '전국', area: '', revenue: '', first: 'energy', second: 'labor', costs: Object.fromEntries(Object.keys(emptyCosts()).map(k=>[k,''])) as Draft['costs'], sample: false });
type Session = { drafts: Record<Mode,Draft>; updateDraft: (mode: Mode,draft: Draft)=>void; diagnoses: Partial<Record<Mode,Diagnosis>>; save: (value:Diagnosis)=>void };
const Context = createContext<Session|null>(null);
export function SessionProvider({children}:{children:React.ReactNode}) {
  const [drafts,setDrafts]=useState<Record<Mode,Draft>>(()=>({simple:newDraft(),precision:newDraft()}));
  const [diagnoses,setDiagnoses]=useState<Partial<Record<Mode,Diagnosis>>>({});
  return <Context.Provider value={{drafts,updateDraft:(mode,draft)=>setDrafts(v=>({...v,[mode]:draft})),diagnoses,save:value=>setDiagnoses(v=>({...v,[value.mode]:value}))}}>{children}</Context.Provider>;
}
export function useSession(){const value=useContext(Context);if(!value)throw new Error('진단 세션이 없습니다.');return value;}
