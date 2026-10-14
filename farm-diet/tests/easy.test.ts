import {describe,it,expect} from 'vitest';
import {areaInPyeong,PYEONG_M2,selectedCategories} from '../src/lib/easy';
describe('쉬운 입력 계산',()=>{
 it('㎡ 면적을 평으로 정확히 바꾼다',()=>{expect(areaInPyeong(300*PYEONG_M2,'m2')).toBeCloseTo(300,10);expect(areaInPyeong(300,'pyeong')).toBe(300);});
 it('비교 제외 목록은 남은 항목만 반환한다',()=>{expect(selectedCategories(['energy','opportunity'])).toHaveLength(7);expect(selectedCategories(['energy'])).not.toContain('energy');});
});
