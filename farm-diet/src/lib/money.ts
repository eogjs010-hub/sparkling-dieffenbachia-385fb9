export type MoneyUnit = 'won' | 'manwon';
export const MAX_MONEY = 9_999_999_999_999;
export function parseMoneyInput(text: string, unit: MoneyUnit): string {
  const clean=text.replaceAll(',','').trim();
  if(!clean) return '';
  if(!(unit==='manwon'?/^\d+(?:\.\d{0,4})?$/:/^\d+$/).test(clean)) throw new Error(unit==='manwon'?'만원 단위는 소수점 4자리까지 입력하세요.':'원 단위는 정수로 입력하세요.');
  const value=Math.round(Number(clean)*(unit==='manwon'?10000:1));
  if(!Number.isSafeInteger(value)||value<0||value>MAX_MONEY) throw new Error('입력 가능한 금액 범위를 초과했습니다.');
  return String(value);
}
export function moneyInputText(value: string, unit: MoneyUnit): string {
  return value===''?'':(Number(value)/(unit==='manwon'?10000:1)).toLocaleString('ko-KR',{maximumFractionDigits:4});
}
const groupText=(n:number)=>n<100?String(n):[1000,100,10,1].map((weight,i)=>{const digit=Math.floor(n/weight)%10;return digit?`${digit}${['천','백','십',''][i]}`:'';}).filter(Boolean).join(' ');
export function koreanMoney(value: number): string {
  if(!Number.isSafeInteger(value)||value<0) throw new Error('유효한 원 단위 금액이 필요합니다.');
  if(value===0)return '0원';
  let remaining=value;const parts:string[]=[];
  for(const [amount,label] of [[1e12,'조'],[1e8,'억'],[1e4,'만'],[1,'']] as const){const n=Math.floor(remaining/amount);if(n)parts.push(`${groupText(n)}${label}`);remaining%=amount;}
  return `${parts.join(' ')} 원`;
}
