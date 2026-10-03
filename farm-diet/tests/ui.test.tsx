// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {SessionProvider,type Mode} from '../src/components/session';
import DiagnosisForm from '../src/components/diagnosis-form';
import Results from '../src/components/results';
import Simulator from '../src/components/simulator';
import {emptyCosts} from '../src/lib/farm';
const router=vi.hoisted(()=>({push:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>router}));
vi.mock('next/link',()=>({default:({children,href,...props}:{children:React.ReactNode;href:string})=><a href={href} {...props}>{children}</a>}));
// Chart layout requires a real browser; these tests focus on form and state behavior.
vi.mock('../src/components/cost-radar',()=>({default:()=> <div>레이더 영역</div>}));
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{(globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);router.push.mockReset();});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();delete (document as Document&{modelContext?:unknown}).modelContext;});
async function mount(node:React.ReactNode){await act(async()=>root.render(node));}
async function click(text:string){const button=[...container.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(button).toBeTruthy();await act(async()=>button!.click());}
async function submit(){await act(async()=>container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));}
function Journey({mode}:{mode:Mode}){const[done,setDone]=useState(false);router.push.mockImplementation(()=>setDone(true));return <SessionProvider>{done?<Results mode={mode}/>:<DiagnosisForm mode={mode}/>}</SessionProvider>;}
describe('사용자 입력과 결과 흐름',()=>{
 it('빈 면적을 제출하면 안내하고 결과로 이동하지 않는다',async()=>{await mount(<Journey mode="simple"/>);await submit();expect(container.querySelector('[role="alert"]')?.textContent).toContain('재배면적');expect(router.push).not.toHaveBeenCalled();});
 it('간편 예시를 제출하면 두 비용만 비교하고 전체 수익은 추정하지 않는다',async()=>{await mount(<Journey mode="simple"/>);await click('예시로');await submit();expect(container.querySelectorAll('.gap-card')).toHaveLength(2);expect(container.textContent).toContain('시설수박 상위 10%');expect(container.textContent).toContain('예시 입력');expect(container.querySelector('.kpi-grid')).toBeNull();expect(container.querySelector('.simulator')).toBeNull();});
 it('간편 선택에서 같은 항목은 중복 선택할 수 없다',async()=>{await mount(<Journey mode="simple"/>);const first=container.querySelector<HTMLSelectElement>('#category-first')!;expect(first.querySelector<HTMLOptionElement>('option[value="labor"]')?.disabled).toBe(true);});
 it('정밀 예시는 9개 비교 행과 9개 슬라이더를 표시하고 임차료 0을 처리한다',async()=>{await mount(<Journey mode="precision"/>);await click('예시로');await submit();expect(container.querySelectorAll('tbody tr')).toHaveLength(9);expect(container.querySelectorAll('input[type="range"]')).toHaveLength(9);const rent=[...container.querySelectorAll('tbody tr')].find(r=>r.textContent?.startsWith('임차료'))!;expect(rent.textContent).toContain('비교 어려움');expect(container.textContent).not.toContain('Infinity');expect(container.textContent).toContain('9대 비용 기준 추정 잔여액');});
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
