# Apple Health 真實資料接入方案

## 結論

這個家庭健康網站如果要接入真正的 Apple Health / Apple Watch 資料，最實際的做法有兩條：

1. 建一個 iPhone 原生 companion app，用 HealthKit 讀資料，再同步到現有 Node.js API。
2. 先做 Health app 匯出檔案匯入，讓網站可上傳 XML 匯出檔。

純 Next.js 網站本身不能直接存取 iPhone 內的 HealthKit 資料庫，所以不能只靠網頁前端完成。

## 推薦順序

### Phase 1: 手動匯入

- 從 iPhone Health app 匯出 XML
- 上傳到網站
- 後端解析步數、心率、睡眠、運動、卡路里
- 存進 PostgreSQL

優點：
- 最快可落地
- 不需要先開發 iOS app
- 很適合驗證資料模型和 dashboard

缺點：
- 不是自動同步

### Phase 2: iPhone Companion App

- 建立 Swift / SwiftUI iOS app
- 使用 HealthKit 要求讀取權限
- 讀取步數、心率、睡眠、運動、活動記錄
- 透過登入 token 把資料同步到現有 backend

優點：
- 可做真正的持續同步
- 可細粒度控制授權類型
- 最接近正式產品形態

缺點：
- 開發成本較高
- 需要 Apple Developer 帳號與 iOS app 交付流程

## 建議讀取的資料類型

- 步數
- 卡路里消耗
- 靜止心率
- 心率樣本
- 睡眠
- 運動紀錄
- 活動環摘要
- 體重

## 與現有系統的整合方式

### Backend

新增幾類 API：

- `POST /api/v1/integrations/apple-health/import`
- `POST /api/v1/integrations/apple-health/sync`
- `GET /api/v1/integrations/apple-health/sources`

### Database

新增資料表：

- `apple_health_imports`
- `apple_health_samples`
- `apple_health_workouts`
- `apple_health_daily_summaries`

### Frontend

新增頁面：

- Apple Health 連接狀態
- 匯入歷史
- 最近同步時間
- 步數 / 睡眠 / 心率 / 活動環圖表

## 安全設計

- 不要把 Apple Health 原始資料直接存在前端 localStorage
- 同步時只傳需要的欄位
- 後端要記錄資料來源、同步時間、用戶同意狀態
- 健康資料應視為高敏感資料，傳輸全程 HTTPS

## 下一步建議

最值得先做的是：

1. 先加 XML 匯入功能
2. 定義 Apple Health sample 的 PostgreSQL schema
3. 再決定要不要補 iPhone 原生同步 app
