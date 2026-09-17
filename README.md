# KZ Personal Website V3

由現有 V2 延伸，保留橘色 KZ 首頁與 #F7F5F0 / #171717 / #F05A28 三色。V1、V2 原始檔未修改。

## 本機開啟

直接雙擊 index.html 即可預覽，無需安裝套件。也可在此資料夾執行：

```sh
python3 -m http.server 8033 --bind 127.0.0.1
```

開啟 http://127.0.0.1:8033 。

## 內容節奏

KZ → WHO I AM → WHAT I'M DOING → MY DREAM → FROM 0 → 1 → RIGHT NOW / WHAT'S NEXT → KEEP IN TOUCH。

0→1 使用深色主區與超大橘色字，凸顯核心挑戰；RIGHT NOW 使用日期與具體近況，並列下一步。自我介紹、生活創作與夢想採較短的閱讀節奏。

## 使用後台修改

後台入口是 `/admin/`。後台可以修改首頁標語、自我介紹、目前項目、RIGHT NOW、WHAT'S NEXT、社群網址，以及上傳照片和影片。內容集中在 `content/site.json`，版面樣式不會被後台改壞。

正式上線前，需要在 `admin/config.yml` 填入 GitHub 儲存庫與 OAuth Worker 網址。Cloudflare Pages 發布 GitHub 儲存庫後，後台每次儲存都會提交內容變更，並觸發網站重新發布。

本機測試 Decap CMS 需啟動網站預覽與 Decap 本機代理；正式上線後不需要本機代理。

## 待補真實素材

原專案 assets 資料夾沒有照片或影片，社群網址也是空白。V3 因此保留三個有明確標籤的素材位置，未放入假冒 KZ 的照片、虛構草稿或其他人的影片。

可直接透過後台「圖片與影片」上傳；檔案會進入 `assets/uploads/`。也可以手動把素材放入 assets/，再修改 `content/site.json`：

- portrait.src：生活照片，如 assets/kz-life.jpg。
- reel.src：短影片，如 assets/reel.mp4；可另填 reel.poster 封面。
- sketch.src：HOCHI 草稿或工作過程照片，如 assets/hochi-sketch.jpg。

圖片載入後會自動取代佔位版面。影片提供原生播放控制、預設靜音、循環播放設定，讓訪客自行播放。缺失素材會保留清楚的備用顯示。

後台的 Instagram、YouTube 欄位請填入完整 HTTPS 個人頁或頻道網址。未設定時會顯示「連結待補」，點擊提供提示，不會導向虛構帳號。

日期及近況文字在 index.html 的 now 區更新。網站不會自動將日期更新成當月，以免把舊近況誤呈現為新資訊。

## Analytics

`tracking.js` 是統一追蹤入口。所有自訂事件都經過 `window.trackEvent(name, properties)`，並自動附上本次瀏覽保存的 `utm_source`、`utm_medium`、`utm_campaign`、`utm_content`。目前會記錄 Instagram／YouTube 點擊、0→1／RIGHT NOW／WHAT'S NEXT 觀看，以及 25／50／75／90% 捲動深度；同一次頁面瀏覽的觀看與捲動事件只送一次。

Cloudflare Web Analytics 負責匿名的 Page Views、Visitors、來源、熱門頁面、裝置和地區資料，不接收自訂事件。若未來加入 GA、Plausible 或 PostHog，只需在 `config.js` 的 `trackEvent` adapter 串接，不必改各區塊。
