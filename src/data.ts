import { openDB } from 'idb';
import JSZip from 'jszip';
export const importance = ['核心文獻', '高度相關', '背景參考', '待判斷'];
export const statuses = ['還沒開始', '進行中', '已讀完'];
export const noteLabels = ['研究問題與目的','理論架構與重要概念','研究對象、樣本數及研究方法','主要發現','研究限制','原文摘錄與原文頁碼','我的理解、疑問與反思','與我的論文之關聯','可用於論文的章節或段落'];
export interface Paper { id:string; title:string; authors:string; year:string; journal:string; keywords:string[]; importance:string; reason:string; status:string; progress:string; abstract:string; design:string; findings:string; notes:Record<string,string>; pdf?:Blob; pdfName?:string; demo?:boolean }
export interface Comparison {id:string; title:string; paperIds:string[]; similar:string; same:string; differences:string; inspiration:string; questions:string; demo?:boolean}
export interface Library {papers:Paper[]; comparisons:Comparison[]}
export const blankPaper = ():Paper => ({id:crypto.randomUUID(), title:'',authors:'',year:'',journal:'',keywords:[],importance:'待判斷',reason:'',status:'還沒開始',progress:'',abstract:'',design:'',findings:'',notes:{}});
const db = openDB('shiye-literature',1,{upgrade(db){db.createObjectStore('library');}});
export async function readLibrary():Promise<Library>{return (await (await db).get('library','current')) ?? {papers:[],comparisons:[]};}
export async function writeLibrary(library:Library){await (await db).put('library',library,'current');}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
export async function exportBackup(library:Library){const zip=new JSZip();const papers=library.papers.map(({pdf,...p})=>({...p,pdfPath:pdf?`pdfs/${p.id}.pdf`:undefined}));for(const p of library.papers)if(p.pdf)zip.file(`pdfs/${p.id}.pdf`,await p.pdf.arrayBuffer());zip.file('library.json',JSON.stringify({format:'shiye',version:1,papers,comparisons:library.comparisons},null,2));return zip.generateAsync({type:'blob'});}
export async function importBackup(file:File):Promise<Library>{
 if(file.size>512*1024*1024)throw Error('備份超過 512 MB，請使用較小的備份。');
 const zip=await JSZip.loadAsync(file);const manifest=zip.file('library.json');if(!manifest)throw Error('找不到 library.json，請選擇拾頁匯出的 ZIP 備份。');
 const data=JSON.parse(await manifest.async('string'));
 if(data.format!=='shiye'||data.version!==1||!Array.isArray(data.papers)||!Array.isArray(data.comparisons)||data.papers.length>10000)throw Error('不支援的備份格式。');
 const ids=new Set<string>();const papers:Paper[]=[];
 for(const p of data.papers){
  if(!p||typeof p.id!=='string'||!p.id||ids.has(p.id))throw Error('文獻識別碼重複或無效。');ids.add(p.id);
  for(const k of ['title','authors','year','journal','importance','reason','status','progress','abstract','design','findings'])if(typeof p[k]!=='string')throw Error('文獻欄位格式不正確。');
  if(!importance.includes(p.importance)||!statuses.includes(p.status)||!Array.isArray(p.keywords)||p.keywords.some((v:unknown)=>typeof v!=='string')||!p.notes||typeof p.notes!=='object'||Array.isArray(p.notes)||Object.values(p.notes).some(v=>typeof v!=='string'))throw Error('文獻或筆記格式不正確。');
  const {pdfPath,...rest}=p;delete rest.pdf;let pdf:Blob|undefined;
  if(pdfPath){if(pdfPath!==`pdfs/${p.id}.pdf`)throw Error('PDF 路徑無效。');const entry=zip.file(pdfPath);if(!entry)throw Error('備份中的 PDF 遺失。');const bytes=await entry.async('uint8array');if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('備份含有無效 PDF。');pdf=new Blob([bytes],{type:'application/pdf'});}
  papers.push({...rest,pdf});
 }
 const cids=new Set<string>();for(const c of data.comparisons){if(!c||typeof c.id!=='string'||cids.has(c.id)||!Array.isArray(c.paperIds)||new Set(c.paperIds).size<2||c.paperIds.some((id:unknown)=>typeof id!=='string'||!ids.has(id)))throw Error('比較紀錄的文獻關聯無效。');cids.add(c.id);for(const k of ['title','similar','same','differences','inspiration','questions'])if(typeof c[k]!=='string')throw Error('比較欄位格式不正確。');}
 return {papers,comparisons:data.comparisons};
}
export function mergeLibrary(a:Library,b:Library):Library{return {papers:[...a.papers.filter(p=>!b.papers.some(x=>x.id===p.id)),...b.papers],comparisons:[...a.comparisons.filter(c=>!b.comparisons.some(x=>x.id===c.id)),...b.comparisons]};}
export function exportCSV(papers:Paper[]){const rows=[['與論文關聯度（重要性）','關聯原因','閱讀狀態','閱讀進度','文獻名稱','文獻作者','文獻年份','發表期刊','文獻關鍵字','文獻摘要','研究設計','研究發現','完整 PDF'],...papers.map(p=>[p.importance,p.reason,p.status,p.progress,p.title,p.authors,p.year,p.journal,p.keywords.join('、'),p.abstract,p.design,p.findings,p.pdfName??''])];return new Blob(['\ufeff'+rows.map(row=>row.map(v=>'"'+(/^[=+\-@\t\r]/.test(v)?"'":'')+v.replaceAll('"','""')+'"').join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});}
export function exampleLibrary():Library { const a={...blankPaper(),title:'家庭支持與青少年希望感之關聯',authors:'林曉晴、陳以安（虛構）',year:'2024',journal:'青少年發展研究（虛構期刊）',importance:'核心文獻',status:'進行中',progress:'已讀完研究方法，第 8 頁',keywords:['家庭支持','希望感','青少年'],abstract:'【虛構示例】探討家庭支持與青少年希望感的關聯，作為學習文獻整理流程的示範，並非真實研究。',design:'【虛構示例】量化研究；高中生問卷；橫斷設計。',findings:'【虛構示例】家庭支持與希望感呈正向關聯。此為示例敘述，不可引用。',reason:'作為論文理論架構與研究變項之參考。',demo:true}; const b={...blankPaper(),title:'從青少年敘事理解家庭互動經驗',authors:'許沐言（虛構）',year:'2023',journal:'家庭與教育評論（虛構期刊）',importance:'高度相關',keywords:['家庭互動','質性研究'],design:'【虛構示例】質性研究；半結構訪談。',demo:true};return {papers:[a,b],comparisons:[]};}

export interface ResearchSpace extends Library {id:string;name:string;description:string}
export interface ResearchState {spaces:ResearchSpace[];activeSpaceId:string|null}
export const defaultSpace = (library:Library={papers:[],comparisons:[]}):ResearchSpace=>({id:'legacy-main',name:'我的研究主題',description:'',...library});
export async function readResearchState():Promise<ResearchState>{
 const database=await db;const tx=database.transaction('library','readwrite');
 let state=await tx.store.get('research-spaces') as ResearchState|undefined;
 if(!state){const old=await tx.store.get('current') as Library|undefined;state={spaces:[defaultSpace(old)],activeSpaceId:null};await tx.store.put(state,'research-spaces');}
 await tx.done;return state;
}
export async function writeResearchState(state:ResearchState){await (await db).put('library',state,'research-spaces');}
export async function exportResearchBackup(state:ResearchState){
 const zip=new JSZip();const spaces=[];
 for(const space of state.spaces){const archive=`spaces/${space.id}.zip`;zip.file(archive,await (await exportBackup(space)).arrayBuffer());spaces.push({id:space.id,name:space.name,description:space.description,archive});}
 zip.file('research-spaces.json',JSON.stringify({format:'shiye-spaces',version:1,spaces},null,2));return zip.generateAsync({type:'blob'});
}
export async function importResearchBackup(file:File):Promise<{spaces:ResearchSpace[];legacy:boolean}>{
 if(file.size>512*1024*1024)throw Error('備份超過 512 MB，請使用較小的備份。');
 const zip=await JSZip.loadAsync(file);const manifest=zip.file('research-spaces.json');
 if(!manifest)return {spaces:[defaultSpace(await importBackup(file))],legacy:true};
 const data=JSON.parse(await manifest.async('string'));
 if(data.format!=='shiye-spaces'||data.version!==1||!Array.isArray(data.spaces)||data.spaces.length>1000)throw Error('不支援的研究空間備份格式。');
 const ids=new Set<string>();const spaces:ResearchSpace[]=[];
 for(const space of data.spaces){
  if(!space||typeof space.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(space.id)||ids.has(space.id)||typeof space.name!=='string'||!space.name.trim()||space.name.length>100||typeof space.description!=='string'||space.archive!==`spaces/${space.id}.zip`)throw Error('研究主題欄位或識別碼無效。');
  ids.add(space.id);const entry=zip.file(space.archive);if(!entry)throw Error('備份中的研究主題遺失。');
  const bytes=await entry.async('uint8array');const library=await importBackup(new File([bytes],space.id+'.zip',{type:'application/zip'}));
  spaces.push({id:space.id,name:space.name,description:space.description,...library});
 }
 return {spaces,legacy:false};
}
export function mergeResearchSpaces(a:ResearchSpace[],b:ResearchSpace[]):ResearchSpace[]{return [...a.filter(space=>!b.some(x=>x.id===space.id)),...b.map(space=>{const previous=a.find(x=>x.id===space.id);return previous?{...space,...mergeLibrary(previous,space)}:space;})];}
