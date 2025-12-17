# 📘 Tanavent - Technical Implementation Specification v3.0

## 0\. Application Overview (Product Definition)

### 0.1. Product Vision

**Project Name:** Tanavent
**Type:** Vertical SaaS for Restaurants (Inventory & Cost Management)
**Concept:**
飲食店（レストラン、バー、居酒屋）の現場における「在庫管理」「発注」「原価計算」の苦痛を取り除くための業務システムです。
PCの前に座って使う管理ツールではなく、**「厨房や冷蔵庫の中で、スマホ片手に高速に操作できる」** 現場第一主義（Mobile First）のツールを目指します。

### 0.2. Core Features & UX Goals

  * **State-Driven Resume:** ブラウザを閉じても、別の端末で開いても、**「前回作業していた全く同じ画面」** から再開できる（URLに依存しない状態永続化）。
  * **No Loading:** 画面遷移やタブ切り替えでスピナーを見せず、ネイティブアプリのように瞬時に切り替わる。
  * **Hybrid Layout:** スマホでは「カード型」、PCでは「テーブル型」として振る舞うが、HTMLソースは一つに統一する（保守性の最大化）。
  * **Multi-Language:** 多国籍なスタッフが働く現場を想定し、UIおよびマスタデータの多言語対応を前提とする。

-----

## 1\. Project Architecture

### Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Monorepo** | **npm workspaces** | Frontend/Backend/Shared 構成 |
| **Frontend** | **React (Vite)** | State駆動SPA。Cloudflare Pagesへデプロイ |
| **Styling** | **Tailwind CSS v4** | CSS Variablesベースの最新設定 |
| **UI Lib** | **Headless UI v2** | アクセシブルなモーダル、コンボボックス |
| **i18n** | **i18next** | クライアントサイド多言語管理 |
| **State** | **Zustand** + **TanStack Query** | クライアント状態管理とサーバー同期 |
| **Backend** | **Hono (Workers)** | API & State Persistence Layer |
| **Database** | **Cloudflare D1** | SQLiteベース。マルチテナントデータの分離と永続化 |
| **Auth** | **Firebase Auth** | 認証基盤 (User ID Provider) |

-----

## 2\. Directory Structure (Monorepo)

`locales` ディレクトリを追加し、多言語リソースを管理します。

```text
/tanavent-monorepo
├── packages/
│   ├── shared/           (Common Types & Schema)
│   │   ├── src/
│   │       ├── schema/
│   │       │   ├── auth.ts
│   │       │   └── inventory.ts
│   │       └── types.ts
│   │
│   ├── api/              (Hono Backend)
│   │   ├── src/
│   │       ├── features/
│   │       │   ├── user-state/  (State Sync Logic)
│   │       │   ├── inventory/
│   │       │   └── ...
│   │       └── index.ts
│   │
│   └── app/              (React Frontend)
│       ├── src/
│       │   ├── lib/
│       │   │   ├── client.ts    (Hono RPC)
│       │   │   └── i18n.ts      (i18next Config) ★New
│       │   ├── locales/         (Translation Files) ★New
│       │   │   ├── ja/
│       │   │   │   ├── common.json
│       │   │   │   └── inventory.json
│       │   │   ├── en/
│       │   │   └── vi/          (Vietnamese)
│       │   ├── stores/          (Zustand Stores)
│       │   ├── view-manager/    (Routing Replacement)
│       │   └── features/        (Feature Views)
│       │       ├── inventory/
│       │       │   ├── components/
│       │       │   │   └── InventoryList.tsx (Single Source HTML) ★
│       │       │   └── InventoryView.tsx
│       │       └── ...
```

-----

## 3\. Database Schema (`packages/shared`)

### `schema/auth.ts` (State & User)

ユーザーの作業状態 (`lastViewState`) に加え、**言語設定 (`language`)** を永続化します。

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const userPreference = sqliteTable("user_preference", {
  userId: text("user_id").primaryKey().references(() => user.id),
  
  // コンテキスト
  activeOrganizationId: text("active_organization_id"),
  activeSectionId: text("active_section_id"), 
  
  // ★ 言語設定 (デフォルトはブラウザ設定または 'ja')
  language: text("language").default('ja'),

  // 画面状態 (JSONで柔軟に保存)
  lastViewState: text("last_view_state", { mode: "json" })
    .$type<{
      view: 'dashboard' | 'inventory' | 'purchasing';
      subView?: string;
      itemId?: string;
    }>()
    .default(JSON.stringify({ view: 'dashboard' })),
    
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

-----

## 4\. API Specification (`packages/api`)

### State Sync Endpoint (`/api/me/state`)

多言語設定もこのエンドポイントで同期します。

  * **GET `/api/me/state`**
      * Response: `{ activeOrganizationId, ..., language: 'vi', lastViewState: {...} }`
      * フロントエンドは受け取った `language` を即座に `i18next.changeLanguage()` に適用します。
  * **POST `/api/me/state`**
      * 言語切り替えや画面遷移時に呼び出し、D1へ保存します。

-----

## 5\. Styling Strategy: Single Source Responsive Table

本プロジェクトの核心的なUI実装戦略です。「PC用」と「スマホ用」のHTMLを分けず、**Tailwind CSS のユーティリティクラスだけで表示形式（Table vs Card）を切り替えます。** これにより、二重管理を防ぎ保守性を最大化します。

### Implementation Pattern

1.  **Container:** `block md:table`
      * 基本はブロック要素（カードの積み重ね）、`md` ブレークポイント以上でテーブル要素として振る舞う。
2.  **Thead:** `hidden md:table-header-group`
      * スマホではヘッダーを隠す。
3.  **Row (tr):** `block md:table-row`
      * スマホではカード枠としてスタイリング、PCではテーブル行。
4.  **Cell (td):** `block md:table-cell` + `before:content-[attr(data-label)]`
      * スマホでは「ラベル + 値」のペアを表示。PCではラベル（`before`要素）を非表示にする。

### Code Example (React Component)

```tsx
// features/inventory/components/InventoryList.tsx
import { useTranslation } from 'react-i18next';

export const InventoryList = ({ items, onSelect }) => {
  const { t } = useTranslation('inventory');

  return (
    <table className="min-w-full block w-full md:table">
      {/* Header: PC only */}
      <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            {t('list.vintage')}
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            {t('list.name')}
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
            {t('list.stock')}
          </th>
        </tr>
      </thead>

      <tbody className="block w-full md:table-row-group md:divide-y md:divide-gray-100">
        {items.map((item) => (
          <tr 
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="
              /* Mobile: Card Style */
              block relative w-full mb-4 p-4 border border-tanavent-blue/30 rounded-lg bg-sky-50/30
              cursor-pointer group hover:bg-sky-100 transition duration-200
              
              /* Desktop: Table Row Style */
              md:table-row md:mb-0 md:p-0 md:bg-white md:border-none md:hover:bg-gray-50
            "
          >
            {/* Vintage Cell */}
            <td 
              data-label={t('list.vintage')}
              className="
                /* Mobile: Label + Value */
                block w-full px-2 py-1 text-right border-b border-dashed border-blue-100 last:border-0
                relative text-tanavent-darknavy
                before:content-[attr(data-label)] before:absolute before:left-2 before:text-gray-500 before:text-xs before:font-bold
                
                /* Desktop: Simple Cell */
                md:table-cell md:w-auto md:px-6 md:py-4 md:text-left md:border-none md:before:content-none
              "
            >
              {item.vintage || 'NV'}
            </td>

            {/* Name Cell */}
            <td 
              data-label={t('list.name')}
              className="
                block w-full px-2 py-1 text-right border-b border-dashed border-blue-100 last:border-0
                relative font-medium
                before:content-[attr(data-label)] before:absolute before:left-2 before:text-gray-500 before:text-xs before:font-bold
                
                md:table-cell md:w-auto md:px-6 md:py-4 md:text-left md:border-none md:before:content-none
              "
            >
              {item.name}
            </td>

            {/* Stock Cell */}
            <td 
              data-label={t('list.stock')}
              className="
                block w-full px-2 py-1 text-right
                relative font-mono font-bold text-tanavent-blue
                before:content-[attr(data-label)] before:absolute before:left-2 before:text-gray-500 before:text-xs before:font-bold
                
                md:table-cell md:w-auto md:px-6 md:py-4 md:text-right md:before:content-none
              "
            >
              {item.quantity} {item.unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

-----

## 6\. Internationalization (i18n) Strategy

### 6.1. Library Configuration

**React-i18next** を使用し、名前空間（Namespace）で辞書ファイルを分割します。

  * `common.json`: "保存", "キャンセル", "戻る" などの汎用文言。
  * `inventory.json`: "在庫", "棚卸", "ヴィンテージ" などのドメイン用語。
  * `auth.json`: ログイン、エラーメッセージ関連。

### 6.2. Workflow

1.  **Init:** アプリ起動時 (`/api/me/state` 取得前) は、ブラウザの言語設定または LocalStorage のキャッシュを表示。
2.  **Sync:** `/api/me/state` のレスポンスを受け取ったら、ユーザーの設定言語 (`language`) に強制切り替え (`i18n.changeLanguage`)。
3.  **Switch:** ユーザーが言語設定を変更した場合、即座にUIを反映しつつ、バックグラウンドで `POST /api/me/state` を叩いて D1 を更新。

### 6.3. Dynamic Data Translation (Future Proofing)

マスタデータ（食材名など）の翻訳については、今回は「UIラベルの多言語化」を優先します。
ただし、DBスキーマ設計時には「ユーザー入力フィールド」と「システム表示フィールド」を意識し、将来的に `name_json` (`{"ja": "トマト", "vi": "Cà chua"}`) カラムへの移行が容易なように、APIレスポンスの型定義 (`shared/types.ts`) を整備しておきます。

-----

## 7\. Implementation Checklist

### 📦 Phase 1: Infrastructure & Auth

1.  **Monorepo Setup**: npm workspaces, `api`, `app`, `shared`。
2.  **i18n Setup**: `i18next` インストール、`locales` フォルダ作成、翻訳JSON作成。
3.  **Shared Schema**: `user_preference` (with language column)。
4.  **Backend Auth**: Firebase Edge Middleware。

### 💾 Phase 2: State Persistence & i18n Sync

1.  **API**: `GET/POST /api/me/state` 実装。
2.  **Frontend Store**: `useViewStore` 実装。
3.  **Sync Logic**: APIレスポンスの `language` を `i18next` に適用するロジックの実装。

### 📱 Phase 3: Inventory MVP (Responsive)

1.  **Styling**: `tailwind.config.js` ではなく CSS Variables (`@theme`) の設定。
2.  **Responsive List**: 上記「Single Source Responsive Table」パターンの実装。
3.  **Inventory View**: 詳細モーダル（Headless UI）の実装。

-----

## 8\. Guidelines for Engineers

  * **HTML Structure:** リスト表示の実装時は、必ず `<table className="block md:table">` パターンを使用してください。`display: none` で2つのDOMを切り替える実装は**禁止**します。
  * **No Hardcoded Strings:** 日本語をソースコードに直接書かないでください。必ず `t('key')` を使用し、`locales/ja/*.json` に定義してください。
  * **Semantic Elements:** カード表示に見える場合でも、セマンティック上は「表」であるため、`<table>`, `<tr>`, `<td>` タグを使用することはアクセシビリティの観点からも正当です。
  * **Mobile First:** スタイリングはまずスマホ用（`block` 等）を書き、その後に `md:` プレフィックスでPC用（`table-cell` 等）を上書きする順序を徹底してください。
