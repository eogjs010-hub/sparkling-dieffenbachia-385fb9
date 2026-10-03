'use client';
import { useEffect,useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { CATEGORIES, gap, type Costs } from '@/lib/farm';
export default function CostRadar({costs,benchmark}:{costs:Costs;benchmark:Costs}){
 const [mounted,setMounted]=useState(false);useEffect(()=>setMounted(true),[]);
 const comparable=CATEGORIES.filter(c=>benchmark[c.key]>0);
 const unavailable=CATEGORIES.filter(c=>benchmark[c.key]===0);
 const values=CATEGORIES.map(c=>({name:c.short,benchmark:benchmark[c.key]>0?100:null,user:benchmark[c.key]>0?Math.min(200,gap(costs[c.key],benchmark[c.key]).index!):null}));
 return <div><div className="chart-legend"><span><i className="legend-dot benchmark"/>상위군 기준 100</span><span><i className="legend-dot user"/>내 농장</span></div><div className="radar-container" role="img" aria-label="9대 비용의 상위군 대비 지수. 상세 수치는 아래 비교 표에서 확인하세요.">{mounted&&comparable.length>=3?<ResponsiveContainer width="100%" height="100%"><RadarChart data={values} outerRadius="67%"><PolarGrid stroke="#dce5e0"/><PolarAngleAxis dataKey="name" tick={{fontSize:12,fill:'#52665b'}}/><PolarRadiusAxis domain={[0,200]} ticks={[50,100,150,200]} axisLine={false} tick={{fontSize:10,fill:'#75847c'}}/><Radar name="상위군" dataKey="benchmark" stroke="#80958a" fill="#aebcb4" fillOpacity={.1} strokeDasharray="5 4" isAnimationActive={false}/><Radar name="내 농장" dataKey="user" stroke="#147b48" fill="#33a164" fillOpacity={.23} strokeWidth={2.5} isAnimationActive={false}/></RadarChart></ResponsiveContainer>:<p className="muted">비용 구조 차트를 준비하고 있습니다.</p>}</div><p className="small-note">200을 넘는 지수는 차트에서 200으로 표시합니다. 실제 차이는 아래 표에서 확인하세요.</p>{unavailable.length>0&&<p className="small-note">비교 어려움: {unavailable.map(c=>c.label).join(', ')}. 상위군 중앙값이 0인 축은 지수와 기준선을 비워 표시합니다.</p>}</div>;
}
