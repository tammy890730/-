import {test,expect} from '@playwright/test';
test('重複啟動只聚焦既有畫面，保留研究主題及未儲存文獻',async({page,context})=>{
 await page.addInitScript(()=>{(window as any).launchFocusCount=0;window.focus=()=>{(window as any).launchFocusCount++;};Object.defineProperty(window,'launchQueue',{configurable:true,value:{setConsumer(consumer:any){(window as any).repeatAppLaunch=consumer;}}});});
 await page.goto('/');await page.getByRole('button',{name:'進入 我的研究主題 的文獻管理',exact:true}).click();await page.getByRole('button',{name:'新增文獻',exact:true}).click();await page.getByLabel('文獻名稱 *').fill('重複啟動時保留的草稿');const originalURL=page.url();
 await page.evaluate(()=>{const launch=(window as any).repeatAppLaunch;launch({targetURL:location.origin+'/?from=shortcut'});launch({targetURL:location.origin+'/'});});
 expect(page.url()).toBe(originalURL);expect(context.pages()).toHaveLength(1);expect(await page.evaluate(()=>(window as any).launchFocusCount)).toBe(2);await expect(page.getByLabel('文獻名稱 *')).toHaveValue('重複啟動時保留的草稿');await expect(page.getByRole('dialog',{name:'新增一篇文獻'})).toBeVisible();
});
test('沒有啟動處理 API 的瀏覽器仍可開啟拾頁',async({page})=>{await page.addInitScript(()=>{Object.defineProperty(window,'launchQueue',{configurable:true,value:undefined});});await page.goto('/');await expect(page.getByRole('button',{name:'進入 我的研究主題 的文獻管理',exact:true})).toBeVisible();});
