import {describe,expect,it} from 'vitest';
import {ASSET_STANDARDS,depreciation,estimateMaintenance,type AssetInput} from '../src/lib/maintenance';
const house:AssetInput={id:'1',standardId:'pipe-house',price:30000000,yearsUsed:3,sharePct:100};
const scope={crop:'시설수박',area:1000};
describe('근거가 있는 보조 계산',()=>{
 it('하우스 3000만원/10년 + 수리비 50만원 = 350만원',()=>{expect(estimateMaintenance([house],500000,scope,'actual').total).toBe(3500000);});
 it('농진청 계속 사용 기준은 연한 초과 자산을 0원으로 단정하지 않는다',()=>{const d=depreciation({...house,yearsUsed:12});expect(d.amount).toBe(2500000);expect(d.extended).toBe(true);expect(d.divisor).toBe(12);});
 it('농진청 확인 자산별 수명과 작목 사용 비중을 적용한다',()=>{expect(depreciation({...house,standardId:'hot-air',price:7000000,sharePct:50}).amount).toBe(500000);expect(depreciation({...house,standardId:'tractor',price:12000000}).amount).toBe(1000000);});
 it('시설별 감가상각을 합하고 수리비는 한 번만 더한다',()=>{expect(estimateMaintenance([house,{...house,id:'2',standardId:'hot-air',price:7000000}],500000,scope,'actual').total).toBe(4500000);});
 it('수리비 300평 참고값은 실제 입력 면적으로 한 번만 확대한다',()=>{const reference={label:'2024년',region:'전국',crop:scope.crop,years:[2024],cohortSize:104,costPer300:150000,area:1000};const result=estimateMaintenance([house],500000,scope,'reference',reference);expect(result.repair).toBe(500000);expect(result.total*300/1000).toBe(1050000);});
 it('빈·음수·중복 자산과 표본 부족·다른 작목 참고값을 거부한다',()=>{
  expect(()=>estimateMaintenance([],0,scope,'actual')).toThrow();
  expect(()=>estimateMaintenance([house,house],0,scope,'actual')).toThrow();
  for(const price of [0,-1,NaN,Infinity])expect(()=>depreciation({...house,price})).toThrow();
  expect(()=>depreciation({...house,sharePct:0})).toThrow();expect(()=>depreciation({...house,yearsUsed:0})).toThrow();
  expect(()=>estimateMaintenance([house],-1,scope,'actual')).toThrow();
  expect(()=>estimateMaintenance([house],0,scope,'reference',{label:'2024년',region:'전국',crop:'다른 작목',years:[2024],cohortSize:20,costPer300:0,area:1000})).toThrow();
 });
 it('설치비 평균·수리비율을 근거 없이 기본값으로 넣지 않는다',()=>{expect(ASSET_STANDARDS.installationPriceDefaults).toBeNull();expect(ASSET_STANDARDS.repairRateDefaults).toBeNull();});
});
