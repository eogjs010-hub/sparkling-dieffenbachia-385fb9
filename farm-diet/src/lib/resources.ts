import type { CategoryKey } from './farm';
export const RESOURCE_CHECKED_ON='2026-10-14';
export const OFFICIAL_RESOURCES={
 manual:'https://nongsaro.go.kr/portal/ps/psx/psxj/cropManualMain.mo?farmerMainFlag=VC011205',
 energy:'https://www.korea.kr/archive/expDocView.do?docId=41106&group=S',
 subsidy:'https://www.agrix.go.kr/',
};
export function cropKeyword(crop:string){return ['방울토마토','토마토','딸기','수박','참외','파프리카','고추','오이','상추','멜론'].find(name=>crop.includes(name))??crop;}
export function cropLearningUrl(crop:string){return `https://hrd.rda.go.kr/ehrd_front/search/search.jsp?query=${encodeURIComponent(cropKeyword(crop))}`;}
export const COST_CHECKS:Record<CategoryKey,string>={
 seed:'종자·종묘의 구입 단가와 투입량, 자가 생산 평가액을 나누어 확인하세요.',
 fertilizer:'토양·양액 분석 결과와 투입 기록을 함께 확인하고, 재배 매뉴얼의 양분 관리 항목을 살펴보세요.',
 pest:'병해충 발생 기록과 방제 횟수·구매 단가를 점검하고, 작목별 병해충 관리 자료를 확인하세요.',
 energy:'연료·전기·수도 비용을 나누고 보온시설과 환경 제어 운전 기록을 확인하세요.',
 materials:'재료별 사용량과 교체주기·구매 단가를 구분해 불필요한 반복 지출이 있는지 살펴보세요.',
 maintenance:'수리비와 감가상각 평가액을 분리하고, 시설·농기계 점검 기록을 확인하세요.',
 labor:'작업별 노동시간과 고용 단가·위탁비를 구분하고, 작목별 작업관리·기계화 자료를 살펴보세요.',
 rent:'토지와 농기계·시설 임차료를 나누어 계약 범위와 해당 작목 부담 비율을 확인하세요.',
 opportunity:'현금 지출과 구분해 자가노동·토지·자본의 평가 기준이 조사 기준과 같은지 확인하세요.',
};
