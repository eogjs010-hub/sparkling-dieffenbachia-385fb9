'use client';
import {useEffect,useState} from 'react';
export default function ReadAloud({text}:{text:string}){
 const[available,setAvailable]=useState(false);const[playing,setPlaying]=useState(false);const[message,setMessage]=useState('');
 useEffect(()=>{setAvailable('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);return()=>{window.speechSynthesis?.cancel();};},[]);
 useEffect(()=>{window.speechSynthesis?.cancel();setPlaying(false);setMessage('');},[text]);
 function read(){window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(text);speech.lang='ko-KR';speech.rate=.85;speech.onend=()=>setPlaying(false);speech.onerror=()=>{setPlaying(false);setMessage('읽어주기를 재생하지 못했습니다. 화면의 글을 확인해주세요.');};window.speechSynthesis.speak(speech);setPlaying(true);}
 return <div className="read-aloud">{available?<><button type="button" className="secondary-button" onClick={read}>{playing?'다시 듣기':'읽어주기'}</button><button type="button" className="secondary-button" disabled={!playing} onClick={()=>{window.speechSynthesis.cancel();setPlaying(false);}}>정지</button></>:<span>읽어주기를 지원하지 않으면 화면의 글로 확인해주세요.</span>}{message&&<p role="status">{message}</p>}</div>;
}
