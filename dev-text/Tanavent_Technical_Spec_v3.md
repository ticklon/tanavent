# 🏗 Tanavent - Technical Specification v3.0

## 1. Overview

**Tanavent** は、飲食店（特にソムリエのいるレストラン）向けの **"Context-Aware Inventory Management System"** です。
v3.0 では、モノレポ構成によるフルスタック開発と、Cloudflare D1 (SQLite) を活用したエッジデータベースアーキテクチャを採用します。

### 1.1. Key Principles

*   **Offline-First Experience:** 厨房や地下倉庫などの不安定なネットワーク環境でも閲覧・操作が可能。
*   **Zero-Latency Navigation:** エッジでのデータ取得と、Local-Firstな状態管理による爆速な画面遷移。
*   **Strict Multi-Tenancy:** 組織（Organization）単位での厳格なデータ分離。

-----

## 2. Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Monorepo** | **NPM Workspaces** | 共通型定義 (`packages/shared`) の共有と一元管理。 |
| **Backend** | **Hono (Cloudflare Workers)** | 起動時間0ms、エッジでの低レイテンシ処理。 |
| **Database** | **Cloudflare D1 (SQLite)** | 安価で高速、エッジネイティブなRDB。 |
| **ORM** | **Drizzle ORM** | 軽量で型安全、SQLライクな操作性。 |
| **Frontend** | **React + Vite** | 標準的でエコシステムが豊富なSPA構成。 |
| **State** | **Zustand + React Query** | シンプルなグローバルステートと、強力なサーバー状態キャッシュ。 |
| **Auth** | **Firebase Auth** | 安全で実装コストの低い認証基盤。 |
| **Styling** | **Tailwind CSS v4** | CSS変数ベースの最新スタイリング。 |

-----

## 3. Architecture: Hybrid State Management

ユーザー体験（UX）と開発効率のバランスを最適化するため、**"Hybrid State Management"** アーキテクチャを採用します。

### 3.1. Concept

状態管理を「永続性」と「役割」に基づいて2つのレイヤーに分離します。

1.  **URL (Routing) - "Where I am"**
    *   **役割:** 画面遷移、現在地、機能の特定
    *   **技術:** React Router v6
    *   **対象:** セクションID、機能ビュー（Inventory/Purchasing）、サブビュー
    *   **メリット:** ブラウザ標準機能（戻る・進む、リロード、ブックマーク）が自然に動作する。

2.  **LocalStorage (User Context) - "Who I am acting as"**
    *   **役割:** ユーザー設定、セッションコンテキスト
    *   **技術:** Zustand (persist middleware)
    *   **対象:**
        *   `activeOrganizationId`: 現在作業中の組織（テナント）。URLから隠蔽することで、単一組織ユーザーにとってURLをシンプルに保つ。
        *   `language`: 言語設定 (`ja` / `en`)。
    *   **メリット:** 組織IDがURLに含まれないため、ユーザーにとってノイズが少ない。

### 3.2. URL Structure

| Path | Description | Access Control |
| :--- | :--- | :--- |
| `/` | ルート。`activeOrganizationId` に基づきリダイレクト。 | Protected |
| `/login`, `/signup` | 認証画面。 | Public |
| `/org/select` | 組織選択画面。 | Protected |
| `/org/create` | 組織作成画面。 | Protected |
| `/settings` | 組織・ユーザー設定。 | Org Required |
| `/sections/:sectionId/inventory` | 在庫一覧・管理画面。 | Org Required |
| `/sections/:sectionId/purchasing` | 発注・仕入れ画面。 | Org Required |
| `/sections/:sectionId/stocktaking` | 棚卸画面。 | Org Required |

### 3.3. State Management (Store)

**`useViewStore` (Zustand)**

*   **Persisted (LocalStorage):**
    *   `activeOrganizationId`: string | null
    *   `language`: string
*   **Transient (Memory only):**
    *   `selectedItemId`: string | null （モーダル表示用）

-----

## 4. Database Schema (D1)

Drizzle ORM を使用して定義します。

### 4.1. Core Schema (`schema/auth.ts`)

認証・組織管理・権限管理を担当します。

```typescript
// packages/shared/src/schema/auth.ts

// ユーザー (Firebase Authと同期)
export const user = sqliteTable("user", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    // ... timestamps
});

// 組織 (テナント)
export const organization = sqliteTable("organization", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    plan: text("plan").default("free"),
    // ...
});

// メンバー (User - Organization)
export const member = sqliteTable("member", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organization.id),
    userId: text("user_id").references(() => user.id),
    role: text("role").default("member"), // owner, admin, member
    // ...
});

// セクション (部門・場所)
export const section = sqliteTable("section", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organization.id),
    name: text("name").notNull(),
    // ...
});
```

### 4.2. Inventory Schema (`schema/inventory.ts`)

在庫・発注・棚卸しデータを管理します。
全てのテーブルは `organization_id` を持ち、行レベルセキュリティ (RLS) のようなフィルタリングをアプリケーションレベルで強制します。

*   **Item:** 商品マスタ兼在庫テーブル。
*   **Category / Supplier:** マスターデータ。
*   **Transaction:** 入出庫履歴（今回はスコープ外だが将来的に）。
*   **StocktakeSession / Record:** 棚卸し機能の中核。

-----

## 5. Security & Validation

### 5.1. Authentication (Firebase Auth)

*   クライアント側で `idToken` を取得し、APIリクエストの `Authorization: Bearer <token>` ヘッダに付与。
*   Hono Middleware (`firebaseAuth`) でトークンを検証し、`c.get('user')` にユーザー情報をセット。

### 5.2. Authorization (Organization Scoped)

APIエンドポイントでは、**必ず** 以下のチェックを行います。

1.  **Authentication Check:** ユーザーがログインしているか。
2.  **Membership Check:** `organizationId` に対して、ユーザーが `member` テーブルに存在するか。
3.  **Scope Check:** アクセスしようとしている `sectionId` が、指定された `organizationId` に属しているか。

```typescript
// Example: Middleware or Helper
const membership = await db.query.member.findFirst({
    where: and(
        eq(member.organizationId, orgId),
        eq(member.userId, user.uid)
    )
});
if (!membership) throw new ForbiddenError();
```

-----

## 6. Directory Structure (Monorepo)

```
/
├── packages/
│   ├── api/            # Hono Backend (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── features/   # Feature-based module (inventory, users, etc.)
│   │   │   ├── middleware/
│   │   │   └── index.ts    # Entry point
│   │   └── wrangler.toml
│   │
│   ├── app/            # React Frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/ # Shared UI components
│   │   │   ├── features/   # Feature-based module
│   │   │   │   ├── inventory/
│   │   │   │   ├── auth/
│   │   │   │   └── settings/
│   │   │   ├── stores/     # Zustand stores
│   │   │   └── lib/        # API Client, Firebase, i18n
│   │
│   └── shared/         # Shared Types & Schema
│       ├── src/
│       │   ├── schema/     # Drizzle Schema
│       │   └── types/      # Shared TS Interfaces
│       └── drizzle.config.ts
```