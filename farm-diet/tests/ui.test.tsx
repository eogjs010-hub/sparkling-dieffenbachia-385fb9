// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {SessionProvider,type Mode} from '../src/components/session';
import DiagnosisForm from '../src/components/diagnosis-form';
import Results from '../src/components/results';
import Simulator from '../src/components/simulator';
import {emptyCosts} from '../src/lib/farm';
import AccessibilityControls from '../src/components/accessibility-controls';
const router=vi.hoisted(()=>({push:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>router}));
vi.mock('next/link',()=>({default:({children,href,...props}:{children:React.ReactNode;href:string})=><a href={href} {...props}>{children}</a>}));
// Chart layout requires a real browser; these tests focus on form and state behavior.
vi.mock('../src/components/cost-radar',()=>({default:()=> <div>레이더 영역</div>}));
vi.mock('../src/components/cost-trend',()=>({default:({region}:{region:string})=> <div data-testid="cost-trend" data-region={region}>비용 추이 영역</div>}));
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{(globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);router.push.mockReset();});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();delete (document as Document&{modelContext?:unknown}).modelContext;});
async function mount(node:React.ReactNode){await act(async()=>root.render(node));}
async function click(text:string){const button=[...container.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(button).toBeTruthy();await act(async()=>button!.click());}
async function submit(){await act(async()=>container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));}
function Journey({mode}:{mode:Mode}){const[done,setDone]=useState(false);router.push.mockImplementation(()=>setDone(true));return <SessionProvider>{done?<Results mode={mode}/>:<DiagnosisForm mode={mode}/>}</SessionProvider>;}
describe('사용자 입력과 결과 흐름',()=>{
 it('퀵 버튼은 만원 표시와 한글 금액을 갱신하고 단위 전환 때 금액을 보존한다',async()=>{
  await mount(<Journey mode="simple"/>);
  expect(container.querySelector<HTMLSelectElement>('#money-unit')!.value).toBe('manwon');
  const quick=container.querySelector<HTMLButtonElement>('button[aria-label="해당 작목 연간 매출에 100만 원 더하기"]')!;
  await act(async()=>quick.click());
  expect(container.querySelector<HTMLInputElement>('#revenue')!.value).toBe('100');
  expect(container.querySelector('#revenue-reading')!.textContent).toContain('만 원');
  const unit=container.querySelector<HTMLSelectElement>('#money-unit')!;
  await act(async()=>{unit.value='won';unit.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.querySelector<HTMLInputElement>('#revenue')!.value).toBe('1,000,000');
 });
 it('최근 3년 비교는 실제 사용 연도와 중앙값 평균임을 밝힌다',async()=>{
  await mount(<Journey mode="precision"/>);
  const period=container.querySelector<HTMLSelectElement>('#comparison-mode')!;
  await act(async()=>{period.value='recent3';period.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.textContent).toContain('2023, 2024년만 비교');
  await click('예시로');await submit();
  expect(container.querySelector('.benchmark-bar')?.textContent).toContain('2022–2024년 중 2개년 평균');
  expect(container.textContent).toContain('연도별 중앙값 평균');
  expect(container.querySelector('[data-testid="cost-trend"]')?.getAttribute('data-region')).toBe('전국');
  expect(container.querySelector('a[href*="docId=41106"]')).toBeTruthy();
 });
 it('큰 글씨·고대비 토글은 누름 상태와 문서 클래스를 바꾸고 해제한다',async()=>{
  await mount(<AccessibilityControls/>);await click('큰 글씨');await click('고대비');
  expect(document.documentElement.classList.contains('large-text')).toBe(true);
  expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  expect(container.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(2);
  await click('큰 글씨');expect(document.documentElement.classList.contains('large-text')).toBe(false);
 });
 it.each(['simple','precision'] as const)('%s 모드에서 2015년을 선택하면 해당 연도 예시·작목·결과를 사용한다',async mode=>{
  await mount(<Journey mode={mode}/>);
  const year=container.querySelector<HTMLSelectElement>('#year')!;
  expect(year.options).toHaveLength(10);
  await act(async()=>{year.value='2015';year.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.querySelector<HTMLSelectElement>('#crop')!.value).toBe('시설토마토(반촉성)');
  await click('예시로');await submit();
  expect(container.querySelector('.benchmark-bar')?.textContent).toContain('2015년 전국 시설토마토(반촉성)');
  expect(container.textContent).toContain('농가 식별번호가 반복');
 });
 it('연도 변경 시 이전 연도의 예시 금액을 지운다',async()=>{
  await mount(<Journey mode="precision"/>);await click('예시로');
  const year=container.querySelector<HTMLSelectElement>('#year')!;
  await act(async()=>{year.value='2016';year.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.querySelector<HTMLInputElement>('#revenue')!.value).toBe('');
  expect(container.querySelector<HTMLInputElement>('#cost-energy')!.value).toBe('');
 });

 it('빈 면적을 제출하면 안내하고 결과로 이동하지 않는다',async()=>{await mount(<Journey mode="simple"/>);await submit();expect(container.querySelector('[role="alert"]')?.textContent).toContain('재배면적');expect(router.push).not.toHaveBeenCalled();});
 it('간편 예시를 제출하면 두 비용만 비교하고 전체 수익은 추정하지 않는다',async()=>{await mount(<Journey mode="simple"/>);await click('예시로');await submit();expect(container.querySelectorAll('.gap-card')).toHaveLength(2);expect(container.textContent).toContain('시설수박 상위 10%');expect(container.textContent).toContain('예시 입력');expect(container.querySelector('.kpi-grid')).toBeNull();expect(container.querySelector('.simulator')).toBeNull();});
 it('간편 선택에서 같은 항목은 중복 선택할 수 없다',async()=>{await mount(<Journey mode="simple"/>);const first=container.querySelector<HTMLSelectElement>('#category-first')!;expect(first.querySelector<HTMLOptionElement>('option[value="labor"]')?.disabled).toBe(true);});
 it('정밀 예시는 9개 비교 행과 9개 슬라이더를 표시하고 임차료 0을 처리한다',async()=>{await mount(<Journey mode="precision"/>);await click('예시로');await submit();expect(container.querySelectorAll('[data-testid="gap-table"] tbody tr')).toHaveLength(9);expect(container.querySelectorAll('input[type="range"]')).toHaveLength(9);const rent=[...container.querySelectorAll('[data-testid="gap-table"] tbody tr')].find(r=>r.textContent?.startsWith('임차료'))!;expect(rent.textContent).toContain('비교 어려움');expect(container.textContent).not.toContain('Infinity');expect(container.textContent).toContain('9대 비용 기준 추정 잔여액');});
 it('직접 결과 화면을 열면 재입력 안내를 표시한다',async()=>{await mount(<SessionProvider><Results mode="precision"/></SessionProvider>);expect(container.textContent).toContain('먼저 입력');expect(container.querySelector('.simulator')).toBeNull();});
});
describe('시뮬레이션의 동일 상태와 WebMCP 등록',()=>{
 it('정상 입력은 화면 잔여액을 바꾸고 범위 오류는 상태를 보존한다',async()=>{
  const tools:Record<string,{execute:(input:unknown)=>unknown}>={};
  (document as Document&{modelContext?:unknown}).modelContext={registerTool:(tool:{name:string;execute:(input:unknown)=>unknown})=>{tools[tool.name]=tool;}};
  const costs=emptyCosts();costs.energy=1000;await mount(<Simulator revenue={2000} costs={costs}/>);
  expect(tools.set_cost_scenario).toBeTruthy();await act(async()=>{tools.set_cost_scenario.execute({changes:{energy:-10}});});
  expect(container.querySelector('[data-testid="projected-balance"]')?.textContent).toBe('1,100원');expect(container.querySelector<HTMLInputElement>('#slider-energy')?.value).toBe('-10');
  expect(()=>tools.set_cost_scenario.execute({changes:{energy:-31}})).toThrow();expect(container.querySelector<HTMLInputElement>('#slider-energy')?.value).toBe('-10');
  await click('초기화');expect(container.querySelector('[data-testid="projected-balance"]')?.textContent).toBe('1,000원');
 });
});
