import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {cp,readFile,writeFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
test('桌面 App：子路徑安裝、離線開啟、安全更新與資料保留',async({page,context},info)=>{
 const site=info.outputPath('site');await cp('dist',site,{recursive:true});
 const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url!,'http://test').pathname);if(!pathname.startsWith('/-/')){res.writeHead(404);res.end();return;}const relative=pathname.slice(3)||'index.html';if(relative.includes('..'))throw Error();const bytes=await readFile(join(site,relative));const ext=relative.split('.').at(-1);res.setHeader('Content-Type',ext==='js'?'application/javascript':ext==='css'?'text/css':ext==='webmanifest'?'application/manifest+json':ext==='png'?'image/png':'text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(bytes);}catch{res.writeHead(404);res.end();}});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address() as {port:number};const url=`http://127.0.0.1:${address.port}/-/`;
 try{
 await page.goto(url);await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(),{once:true}));});
 const manifest=await page.evaluate(async()=>{const link=document.querySelector<HTMLLinkElement>('link[rel=manifest]')!;return (await fetch(link.href)).json();});expect(manifest.display).toBe('standalone');expect(manifest.icons.length).toBe(2);
 await expect(page.getByRole('button',{name:'安裝到桌面',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'進入 我的研究主題 的文獻管理',exact:true}).click();await page.getByRole('button',{name:'先用虛構示例體驗'}).click();await expect(page.getByRole('button',{name:'資料已儲存於此瀏覽器'})).toBeVisible();
 await context.setOffline(true);await page.reload();await expect(page.locator('tbody tr')).toHaveCount(2);await context.setOffline(false);
 // Simulate a new deployment without changing the user's source or local database.
 const asset=(await readdir(join(site,'assets'))).find(x=>x.endsWith('.js'))!;const js=await readFile(join(site,'assets',asset),'utf8');expect(js).toContain('收藏每一份文獻，串連每一個想法，慢慢理出你的論文脈絡。');await writeFile(join(site,'assets',asset),js.replace('收藏每一份文獻，串連每一個想法，慢慢理出你的論文脈絡。','新版研究書桌'));
 const sw=await readFile(join(site,'sw.js'),'utf8');await writeFile(join(site,'sw.js'),sw.replace(/shiye-app-[a-f0-9]+/,'shiye-app-test-update'));
 await page.getByRole('button',{name:'新增文獻',exact:true}).click();await page.getByLabel('文獻名稱 *').fill('尚在編輯的文獻');
 await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg!.update();});
 const update=page.getByRole('button',{name:'儲存後更新',exact:true});await expect(update).toBeVisible();await expect(update).toBeDisabled();await expect(page.getByLabel('文獻名稱 *')).toHaveValue('尚在編輯的文獻');
 await page.getByRole('dialog').getByRole('button',{name:'儲存文獻',exact:true}).click();await expect(update).toBeEnabled();await update.click();await expect(page.getByText('新版研究書桌',{exact:true})).toBeVisible();await expect(page.locator('tbody tr')).toHaveCount(3);await expect(page.getByRole('button',{name:'尚在編輯的文獻',exact:true})).toBeVisible();
 }finally{await context.setOffline(false);await new Promise<void>(r=>server.close(()=>r()));}
});
