import { CATEGORIES, type CategoryKey } from './farm';
export const EASY_NAMES:Record<CategoryKey,string>={seed:'씨앗·모종에 쓴 돈',fertilizer:'비료·영양제에 쓴 돈',pest:'농약·병해충 방제에 쓴 돈',energy:'물·전기·난방에 쓴 돈',materials:'비닐·상토 등 재료에 쓴 돈',maintenance:'수리비·시설 가치 감소액',labor:'사람을 고용하거나 작업을 맡긴 비용',rent:'땅·시설·기계 빌린 돈',opportunity:'내 노동·땅·자본의 평가비용'};
export const PYEONG_M2=400/121;
export function areaInPyeong(value:number,unit:'pyeong'|'m2'){return unit==='m2'?value/PYEONG_M2:value;}
export function selectedCategories(excluded:CategoryKey[]){return CATEGORIES.map(c=>c.key).filter(key=>!excluded.includes(key));}
