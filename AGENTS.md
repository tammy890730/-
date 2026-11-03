# 拾頁開發與發布

使用既有 /workspace/- checkout，不要建立 worktree，除非使用者明確要求。

使用者希望在這裡提出修改後，桌面的拾頁 App 能收到新版。正式安裝入口必須是固定的 HTTPS 網址。下載的 HTML、環境快照與本機預覽都不代表已發布。

- 修改功能後執行 npm run build，依變更執行相關 Playwright 測試。PWA 測試需要 dist/，先建置。
- 發布流程為 .github/workflows/pages.yml，main 分支更新後建置並發布 GitHub Pages。第一次需要在 GitHub 儲存庫 Settings → Pages 將 Source 設為 GitHub Actions。
- 使用現有平台 HTTPS Git 代理與已注入的 GitHub 身分。權限不足或網域被阻擋時，不要索取聊天中的 token，也不要繞過代理。完成獨立工作並精確回報阻擋。
- 在已有網站發布授權與可用權限時，將修改發布到既有固定網址，檢查 Actions 成功與線上版本後才說更新已上線。僅在聊天室改程式，不會使桌面 App 自動更新。
- PWA 使用版本化程式快取，開啟或回到前景會檢查更新。下載新版後等待使用者按「儲存後更新」；有未儲存表單或儲存失敗時不可自動重載。
- IndexedDB shiye-literature 是使用者的文獻、筆記和 PDF。程式更新不可清除此資料庫。不要把測試樣本或個人文獻發布到網站。
- 下載版 HTML、不同網址與不同瀏覽器不共用資料。搬移至正式網站時以完整 ZIP 備份及還原一次。
