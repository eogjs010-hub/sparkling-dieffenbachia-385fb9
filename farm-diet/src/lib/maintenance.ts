import standards from '@/data/asset-standards.json';
import {MAX_MONEY} from './money';
export const ASSET_STANDARDS=standards;
export type AssetInput={id:string;standardId:string;price:number;yearsUsed:number;sharePct:number};
export type RepairReference={label:string;region:string;crop:string;years:number[];cohortSize:number;costPer300:number;area:number};
export type MaintenanceEstimate={version:string;assets:AssetInput[];depreciation:number;repair:number;total:number;repairSource:'actual'|'reference';reference?:RepairReference;scope:{crop:string;area:number};sourceYear:number};
export function depreciation(asset:AssetInput){
 const standard=standards.assets.find(s=>s.id===asset.standardId);
 if(!standard)throw new Error('기준표에 있는 시설·기계를 선택해주세요.');
 if(!Number.isSafeInteger(asset.price)||asset.price<=0||asset.price>MAX_MONEY)throw new Error('설치·구입 금액을 입력해주세요.');
 if(!Number.isInteger(asset.yearsUsed)||asset.yearsUsed<1||asset.yearsUsed>100)throw new Error('사용기간은 1~100년으로 입력해주세요.');
 if(!Number.isFinite(asset.sharePct)||asset.sharePct<=0||asset.sharePct>100)throw new Error('해당 작목 사용 비중은 0% 초과 100% 이하입니다.');
 const divisor=Math.max(standard.lifeYears,asset.yearsUsed);
 return {amount:asset.price/divisor*asset.sharePct/100,divisor,lifeYears:standard.lifeYears,extended:asset.yearsUsed>standard.lifeYears,label:standard.label};
}
export function estimateMaintenance(assets:AssetInput[],repair:number,scope:{crop:string;area:number},repairSource:'actual'|'reference',reference?:RepairReference):MaintenanceEstimate{
 if(!assets.length||assets.length>20||new Set(assets.map(a=>a.id)).size!==assets.length)throw new Error('시설·기계 목록을 확인해주세요.');
 if(!Number.isFinite(scope.area)||scope.area<=0||scope.area>1e8||!scope.crop)throw new Error('농장 정보의 작목과 면적을 먼저 입력해주세요.');
 if(!Number.isFinite(repair)||repair<0||repair>MAX_MONEY)throw new Error('연간 수리유지비를 입력하거나 조사 참고값을 선택해주세요.');
 if(repairSource==='reference'&&(!reference||reference.area!==scope.area||reference.crop!==scope.crop||reference.cohortSize<50||!reference.years.length||!Number.isFinite(reference.costPer300)||reference.costPer300<0||Math.abs(repair-reference.costPer300*scope.area/300)>0.001))throw new Error('수리비 참고자료의 작목·면적·표본을 확인해주세요.');
 const amount=assets.reduce((sum,a)=>sum+depreciation(a).amount,0);
 const total=Math.round(amount+repair);
 if(!Number.isSafeInteger(total)||total>MAX_MONEY)throw new Error('입력 가능한 총액을 초과했습니다.');
 return {version:standards.version,assets:assets.map(a=>({...a})),depreciation:amount,repair,total,repairSource,...(repairSource==='reference'?{reference}:{}),scope:{...scope},sourceYear:standards.source.year};
}
