import { CATEGORIES, type CategoryKey } from './farm';
export const EASY_NAMES:Record<CategoryKey,string> = Object.fromEntries(CATEGORIES.map(c=>[c.key,c.label])) as Record<CategoryKey,string>;
export const PYEONG_M2=400/121;
export function areaInPyeong(value:number,unit:'pyeong'|'m2'){return unit==='m2'?value/PYEONG_M2:value;}
export function selectedCategories(excluded:CategoryKey[]){return CATEGORIES.map(c=>c.key).filter(key=>!excluded.includes(key));}
