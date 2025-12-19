# リファクタリング計画: "Hybrid State Management"

現在の「DBにUI状態（最後に開いた画面やセクション）を同期する」方式から、「Web標準（URL + LocalStorage）」に準拠したハイブリッドな構成へ移行する計画書です。

## 1. Core Concept (基本思想)

状態管理を以下の2つのレイヤーに分離し、シンプルかつ標準的なWeb UXを実現します。

1.  **URL (Routing):**
    *   **役割:** 「今どこにいるか（場所）」を定義する。
    *   **対象:** セクション、機能ビュー（在庫・仕入れ・棚卸）、サブビュー（設定など）。
    *   **メリット:** ブラウザバック、ブックマーク、リロードが自然に動作する。URLを共有すれば同じ画面が開く。
2.  **LocalStorage (Session/Preference):**
    *   **役割:** 「ユーザーの好み・文脈」を保持する。
    *   **対象:**
        *   `activeOrganizationId`: 現在作業中の組織（テナント）。URLには含めず、ログイン後の「コンテキスト」として扱う。
        *   `language`: 表示言語（'ja' / 'en'）。
    *   **メリット:** 組織IDがURLに含まれないため、単一組織ユーザーにとってURLがクリーンになる。

## 2. Refactoring Phases

### Phase 1: Frontend Routing & State (基盤移行)

1.  **Store Refactoring (`viewStore.ts`):**
    *   `lastViewState` (DB同期) を廃止。
    *   `activeOrganizationId`, `language` を **Zustand `persist` middleware** を使用して LocalStorage に保存する形式に変更。
    *   API同期ロジック (`syncState`) を削除。

2.  **Router Implementation (`App.tsx` & `routes.tsx`):**
    *   `react-router-dom` を導入。
    *   **URL Structure (ルート設計):**
        *   `/`
            *   → `activeOrganizationId` があれば、最後に見たセクション（LocalStorageにあれば）or デフォルト画面へリダイレクト。
            *   → なければ `/org/select` へ。
        *   `/org/select` (組織選択)
        *   `/org/create` (組織作成)
        *   `/sections/:sectionId/:view` (メイン業務)
            *   例: `/sections/sec_123/inventory` (在庫一覧)
            *   例: `/sections/sec_123/purchasing` (仕入れ)
            *   `view` パラメータでタブを制御。
        *   `/settings` (組織設定)
            *   コンテキスト（組織ID）はLocalStorageから取得。

3.  **Component Update:**
    *   `Sidebar`:
        *   セクションリンクを `<NavLink to="/sections/:id/inventory">` に変更。
        *   組織切り替えは `activeOrganizationId` を更新して `/` へリダイレクト。
    *   `SectionDashboard`:
        *   URLパラメータ (`useParams`) から `sectionId`, `view` を取得して表示内容を決定。

### Phase 2: Cleanup (負債削除)

1.  **Backend Cleanup:**
    *   `packages/api/src/features/user-state.ts` (状態同期エンドポイント) を削除。
    *   `packages/api/src/index.ts` からルート登録を削除。

2.  **Database Schema Cleanup:**
    *   `packages/shared/src/schema/auth.ts` から `userPreference` テーブル定義を削除。
    *   マイグレーションを実行し、DBからテーブルをドロップ。

---

## 3. Benefits

*   **Simplicity:** フロントエンド・バックエンド共にコード量が削減され、見通しが良くなる。
*   **Standard UX:** ブラウザの標準機能（戻る・進む）が直感的に使えるようになる。
*   **Clean URL:** 組織IDがURLに含まれないため、ユーザーにとってシンプルで分かりやすいURLになる。
