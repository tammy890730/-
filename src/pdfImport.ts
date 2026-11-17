import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type {Paper} from './data';
GlobalWorkerOptions.workerSrc=worker;
export async function recognizePDF(file:File,onProgress:(text:string)=>void):Promise<{fields:Partial<Paper>;notice:string}>{
 if(file.size>100*1024*1024)throw Error('單一 PDF 上限為 100 MB。');
 if(new TextDecoder().decode(await file.slice(0,5).arrayBuffer())!=='%PDF-')throw Error('請選擇有效的 PDF 檔案。');
 const task=getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,cMapUrl:`${import.meta.env.BASE_URL}pdf-assets/cmaps/`,cMapPacked:true,standardFontDataUrl:`${import.meta.env.BASE_URL}pdf-assets/standard_fonts/`});
 try{
 const doc=await task.promise;const meta=await doc.getMetadata();const info=meta.info as Record<string,unknown>;const lines:string[]=[];
 const count=Math.min(doc.numPages,12);
 for(let n=1;n<=count;n++){onProgress(`正在辨識第 ${n} / ${count} 頁…`);const page=await doc.getPage(n);const text=await page.getTextContent();let line='';let y:number|undefined;
 // 封面常按文字物件的建立順序輸出，先依頁面位置還原閱讀順序。
 if(n===1){const items=text.items.filter(item=>'str'in item).sort((a,b)=>Math.abs(a.transform[5]-b.transform[5])>3?b.transform[5]-a.transform[5]:a.transform[4]-b.transform[4]);for(const item of items){if(!item.str.trim())continue;const nextY=item.transform[5];if(y!==undefined&&Math.abs(nextY-y)>3&&line){lines.push(line.trim());line='';}line+=item.str+' ';y=nextY;}if(line)lines.push(line.trim());page.cleanup();continue;}
 for(const item of text.items){if(!('str'in item))continue;const nextY=item.transform[5];if(y!==undefined&&Math.abs(nextY-y)>3&&line){lines.push(line.trim());line='';}line+=item.str+(item.hasEOL?'':' ');y=nextY;if(item.hasEOL){lines.push(line.trim());line='';}}if(line)lines.push(line.trim());page.cleanup();}
 const clean=lines.filter(Boolean);const text=clean.join('\n');if(text.replace(/\s/g,'').length<40)throw Error('未找到足夠文字；此 PDF 可能是掃描檔。此版本尚未支援 OCR，請手動填寫資料。');
 const fields:Partial<Paper>={};const metadata=(key:string)=>typeof info[key]==='string'?(info[key] as string).trim():'';
 const title=metadata('Title');if(title&&!/^(untitled|microsoft|word|document)/i.test(title))fields.title=title;
 if(!fields.title){const candidate=clean.slice(0,15).find(l=>l.length>12&&l.length<240&&!/https?:|doi\b|issn|copyright|©|journal|期刊|學報|學刊|出版日期|publication date|作者|author|頁數|第.+期/i.test(l));if(candidate)fields.title=candidate;}
 const labeledAuthor=text.slice(0,4000).match(/(?:作者\s*(?:\/\s*Author)?|Authors?)\s*[:：]\s*([^\n]+)/i)?.[1];
 if(metadata('Author')||labeledAuthor)fields.authors=metadata('Author')||labeledAuthor?.trim();
 const year=text.slice(0,5000).match(/\b(?:19|20)\d{2}\b/);if(year)fields.year=year[0];
 const keywords=metadata('Keywords')||text.match(/(?:關鍵[詞字]|关键词|Keywords?)\s*[:：]\s*([^\n]+)/i)?.[1];if(keywords)fields.keywords=keywords.split(/[;,，；、]/).map(x=>x.trim()).filter(Boolean);
 const journal=clean.slice(0,15).find(l=>/journal|review|期刊|學報|學刊/i.test(l)&&l!==fields.title);if(journal)fields.journal=journal;
 function section(heading:string){const start=clean.findIndex(l=>new RegExp(`^(?:[0-9一二三四五六七八九.、\\s]+)?(?:${heading})(?:\\s*[:：]\\s*|$|\\s+)`,'i').test(l));if(start<0)return undefined;const out=[clean[start].replace(new RegExp(`^.*?(?:${heading})\\s*[:：]?\\s*`,'i'),'')];for(let i=start+1;i<clean.length&&out.join(' ').length<5000;i++){if(/^(?:[\d.、\s]+)?(?:keywords?|關鍵[詞字]|introduction|緒論|前言|methods?|methodology|研究方法|研究設計|results?|findings|研究結果|研究發現|discussion|討論|conclusions?|結論|references|參考文獻)\s*[:：]?\s*$/i.test(clean[i])||/^(?:keywords?|關鍵[詞字])\s*[:：]/i.test(clean[i]))break;out.push(clean[i]);}return out.join('\n').trim()||undefined;}
 fields.abstract=section('abstract|摘要');fields.design=section('methods?|methodology|研究方法|研究設計');fields.findings=section('results?|findings|研究結果|研究發現');
 return {fields,notice:`已讀取前 ${count} 頁${doc.numPages>count?`（全文 ${doc.numPages} 頁）`:''}。結果為 PDF 中繼資料與文字段落擷取，請核對原文；未辨識的欄位留白。`};
 }catch(error){const e=error as Error;if(e.name==='PasswordException')throw Error('這份 PDF 有密碼保護，請先解鎖後再上傳。');if(/InvalidPDF|MissingPDF|UnknownError/.test(e.name))throw Error('無法讀取這份 PDF，請確認檔案完整且未損毀。');throw error;}finally{await task.destroy();}
}
