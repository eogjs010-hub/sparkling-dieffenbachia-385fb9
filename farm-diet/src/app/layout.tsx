import type { Metadata } from 'next';
import Link from 'next/link';
import { Sprout } from 'lucide-react';
import { SessionProvider } from '@/components/session';
import './globals.css';
export const metadata: Metadata = { title: '팜 다이어트 · Farm Diet', description: '실제 농산물소득조사 기반, 300평 기준 농가 비용 진단', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body><a className="skip-link" href="#main">본문으로 이동</a><header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="팜 다이어트 홈"><span className="brand-icon"><Sprout size={25}/></span><span>팜 다이어트<small>FARM DIET</small></span></Link><span className="header-tag">농장의 숫자를, 더 건강하게.</span><span className="year-label">2024 조사 데이터</span></div></header><SessionProvider>{children}</SessionProvider><footer className="site-footer"><span>Farm Diet · 300평 기준 경영 진단</span><span>입력한 농장 정보는 서버에 저장하지 않습니다.</span></footer></body></html>;
}
