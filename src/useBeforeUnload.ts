import {useEffect,useRef} from 'react';
/** Native close/reload/navigation prompt; only active while data is at risk. */
export function useBeforeUnload(unsaved:boolean){
 const current=useRef(unsaved);current.current=unsaved;
 useEffect(()=>{
  if(!unsaved)return;
  const warn=(event:BeforeUnloadEvent)=>{if(!current.current)return;event.preventDefault();event.returnValue='';};
  window.addEventListener('beforeunload',warn);
  return()=>window.removeEventListener('beforeunload',warn);
 },[unsaved]);
}
