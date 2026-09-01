# 101 午餐 Roulette PWA

## 功能
- 每週一～四為一個循環
- 正常模式下，若本週已有一餐實際或預估 > NT$200，後續 > NT$200 店家會暫時排除
- 本週已吃過的店家抽中權重降為原本 20%
- 省錢模式只抽 NT$180 以下
- 可排除韓式 / 超商
- 每天可重抽一次
- 可記錄實際花費
- 可新增、停用、刪除店家
- 可匯出 CSV
- 資料只存在瀏覽器 LocalStorage

## 使用方式
PWA 的離線安裝功能需要透過 http/https 開啟，不能直接雙擊 file:// index.html。

### 最簡單測試
若電腦有 Python：
python -m http.server 8080

然後瀏覽器開：
http://localhost:8080

手機要安裝成 PWA，建議部署到 GitHub Pages / Cloudflare Pages / Netlify 等 HTTPS 空間。
