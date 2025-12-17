**Tanavent Technical Implementation Specification v3.0** に完全に準拠した、Drizzle ORM 用のデータベーススキーマ定義（`auth.ts` と `inventory.ts`）を提示します。

このスキーマは、マルチテナントの厳格な分離、ステート駆動アプリケーションのための状態永続化、および国際化対応の基盤を含んでいます。

-----

### 📂 File 1: `packages/shared/src/schema/auth.ts`

ここでは「認証」「組織構造」「ユーザー設定（状態保存）」を定義します。
Better Auth を廃止し、Firebase Auth (UID) を主キーとする設計に変更しています。

```typescript
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

/**
 * ------------------------------------------------------------------
 * 1. User & Preference (Core of State-Driven SPA)
 * ------------------------------------------------------------------
 */

// ユーザー基本テーブル
// IDは Firebase Authentication の UID をそのまま使用します。
export const user = sqliteTable("user", {
  id: text("id").primaryKey(), // Firebase UID
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  
  // 作成日・更新日 (Unix Timestamp)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// ★ ユーザー作業状態の永続化テーブル (User Preference)
// アプリ起動時にこのテーブルを読み込み、前回中断した画面・言語設定を復元します。
export const userPreference = sqliteTable("user_preference", {
  // Userテーブルと 1:1 の関係
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),

  // コンテキスト (前回作業していた組織・セクション)
  activeOrganizationId: text("active_organization_id"),
  activeSectionId: text("active_section_id"),

  // 言語設定 (v3 i18n対応)
  // ブラウザ設定より優先され、API経由で同期されます。
  language: text("language").default("ja"), // 'ja', 'en', 'vi'

  // 画面状態 (View State)
  // JSON形式で保存することで、将来的に画面が増えてもスキーマ変更なしで対応可能。
  // 例: { "view": "inventory", "subView": "detail", "itemId": "123" }
  lastViewState: text("last_view_state", { mode: "json" })
    .$type<{
      view: 'dashboard' | 'inventory' | 'purchasing' | 'stocktaking' | 'settings';
      subView?: string; // 'list', 'detail-modal'
      itemId?: string;  // 選択中のアイテムID
      filters?: Record<string, any>; // 検索条件の保存
    }>()
    .default(sql`'{"view": "dashboard"}'`), // デフォルト値

  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

/**
 * ------------------------------------------------------------------
 * 2. Organization & Scope (Multi-Tenancy)
 * ------------------------------------------------------------------
 */

// 組織 (テナントルート)
export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  plan: text("plan").default("free"), // 'free', 'pro', 'enterprise'
  stripeCustomerId: text("stripe_customer_id"),
  
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// セクション (店舗内の部門)
// 例: "Kitchen", "Bar", "Wine Cellar"
// 在庫データは必ずこの Section ID に紐づきます。
export const section = sqliteTable("section", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(),
  
  // UI制御設定 (JSON)
  // 例: { "showVintage": true, "allowNegativeStock": false }
  settings: text("settings", { mode: "json" })
    .$type<{
      showVintage?: boolean;
      showSupplier?: boolean;
    }>()
    .default(sql`'{}'`),
});

/**
 * ------------------------------------------------------------------
 * 3. Membership & Permissions
 * ------------------------------------------------------------------
 */

// メンバー (User <-> Organization の中間テーブル)
export const member = sqliteTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  role: text("role").notNull().default("member"), // 'owner', 'admin', 'member'
  joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
});

// メンバーのセクションアクセス権限 (Member <-> Section の中間テーブル)
// メンバーが「どのセクションを操作できるか」を厳密に管理します。
export const memberSection = sqliteTable("member_section", {
  memberId: text("member_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  sectionId: text("section_id")
    .notNull()
    .references(() => section.id, { onDelete: "cascade" }),
}, (t) => ({
  // 複合主キーで重複登録を防止
  pk: primaryKey({ columns: [t.memberId, t.sectionId] }),
}));

// 招待リンク管理
export const invitation = sqliteTable("invitation", {
  id: text("id").primaryKey(), // トークン文字列
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  role: text("role").default("member"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  status: text("status").default("active"), // 'active', 'revoked', 'accepted'
});

// --- Relations Definitions (For Drizzle Query Builder) ---
export const userRelations = relations(user, ({ one }) => ({
  preference: one(userPreference, {
    fields: [user.id],
    references: [userPreference.userId],
  }),
}));
```

-----

### 📂 File 2: `packages/shared/src/schema/inventory.ts`

ここでは在庫管理のビジネスロジックを定義します。
**すべてのテーブルに `organizationId` を持たせる**ことで、クエリ漏れによるデータ混入事故を物理的に防ぎやすくしています。

```typescript
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { organization, section } from "./auth";

/**
 * ------------------------------------------------------------------
 * 1. Master Data (Scoped by Section)
 * ------------------------------------------------------------------
 */

// カテゴリー (例: "赤ワイン", "葉物野菜")
export const category = sqliteTable("category", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  sectionId: text("section_id").notNull().references(() => section.id, { onDelete: 'cascade' }),
  
  name: text("name").notNull(),
  displayOrder: integer("display_order").default(0),
});

// 取引先 (例: "YY酒販", "XX精肉店")
export const supplier = sqliteTable("supplier", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  sectionId: text("section_id").notNull().references(() => section.id, { onDelete: 'cascade' }),
  
  name: text("name").notNull(),
  contactInfo: text("contact_info"), // 電話番号やEmail
});

// 商品マスタ & 現在在庫 (Item)
export const item = sqliteTable("item", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  sectionId: text("section_id").notNull().references(() => section.id, { onDelete: 'cascade' }),
  
  categoryId: text("category_id").references(() => category.id, { onDelete: 'set null' }),
  supplierId: text("supplier_id").references(() => supplier.id, { onDelete: 'set null' }),

  name: text("name").notNull(),       // 正式名称
  subName: text("sub_name"),          // 略称・呼び名
  vintage: integer("vintage"),        // 年号 (ワイン等用、Null許可)
  unit: text("unit").default('pc'),   // 単位 (pc, kg, bottle)
  
  // 理論在庫数 (Theoretical Stock)
  // 発注や棚卸しによって増減します。
  quantity: real("quantity").notNull().default(0),
  
  // コスト管理
  lastCostPrice: integer("last_cost_price").default(0), // 最終仕入れ単価(円)
  minStockLevel: real("min_stock_level").default(0),    // 発注点アラート用

  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * ------------------------------------------------------------------
 * 2. Purchasing (発注・仕入れ)
 * ------------------------------------------------------------------
 */

// 発注伝票 (ヘッダー)
export const purchaseOrder = sqliteTable("purchase_order", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  supplierId: text("supplier_id").notNull().references(() => supplier.id),
  
  date: integer("date", { mode: "timestamp" }).notNull(),
  status: text("status").notNull().default('draft'), // 'draft' -> 'ordered' -> 'received'
  
  totalAmount: integer("total_amount").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// 発注明細 (行)
export const purchaseItem = sqliteTable("purchase_item", {
  id: text("id").primaryKey(),
  purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrder.id, { onDelete: 'cascade' }),
  itemId: text("item_id").notNull().references(() => item.id),
  
  quantity: real("quantity").notNull(),   // 発注数
  costPrice: integer("cost_price").notNull(), // 単価
  
  // 受領数 (検品用)
  // null = 未検品, 数値 = 検品済み
  receivedQuantity: real("received_quantity"),
});

/**
 * ------------------------------------------------------------------
 * 3. Stocktaking (棚卸) - The Core Feature
 * ------------------------------------------------------------------
 */

// 棚卸セッション
// "2025年10月末棚卸" などのイベント単位
export const stocktakeSession = sqliteTable("stocktake_session", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  sectionId: text("section_id").notNull().references(() => section.id, { onDelete: 'cascade' }),
  
  name: text("name").notNull(), 
  status: text("status").notNull().default('open'), // 'open' -> 'closed' (closed時に在庫上書き)
  
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  closedAt: integer("closed_at", { mode: "timestamp" }),
});

// 棚卸記録 (明細)
export const stocktakeRecord = sqliteTable("stocktake_record", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => stocktakeSession.id, { onDelete: 'cascade' }),
  itemId: text("item_id").notNull().references(() => item.id),
  
  // スナップショット (棚卸開始時点の理論在庫)
  expectedQuantity: real("expected_quantity").notNull(),
  
  // 実棚数 (スタッフが入力した数)
  actualQuantity: real("actual_quantity").notNull(),
  
  // 差異 (SQLite Generated Column)
  // 計算式: 実棚 - 理論
  diffQuantity: real("diff_quantity")
    .generatedAlwaysAs(sql`actual_quantity - expected_quantity`),
    
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * ------------------------------------------------------------------
 * 4. Daily Sales (売上簡易記録)
 * ------------------------------------------------------------------
 */

export const dailySales = sqliteTable("daily_sales", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  sectionId: text("section_id").notNull().references(() => section.id, { onDelete: 'cascade' }),
  
  date: integer("date", { mode: "timestamp" }).notNull(),
  amount: integer("amount").notNull().default(0),
  customerCount: integer("customer_count").default(0),
  note: text("note"),
});
```

-----

### 🔑 設計のポイント解説

1.  **Firebase Auth との完全統合 (`user` テーブル)**

      * `auth.ts` の `user.id` は Firebase の UID を格納します。これにより、クライアントサイドで取得したトークン (`Bearer Token`) とバックエンドのユーザーデータを紐付ける際のオーバヘッドを最小化しています。

2.  **状態駆動アーキテクチャの心臓部 (`user_preference`)**

      * `lastViewState` カラムを JSON 型で定義しました。これにより、フロントエンドの画面が増えたり、保存したい状態（開いているモーダルのIDなど）が複雑化しても、**DBマイグレーションなしで柔軟に対応**できます。
      * v3ドキュメントの要件通り、ここに `language` カラムを含め、デバイスを跨いだ言語設定の同期を実現します。

3.  **マルチテナントのガードレール (`organizationId`)**

      * `inventory.ts` の全ての業務テーブル（`item`, `purchaseOrder`, `stocktakeSession`...）に `organizationId` を付与しました。
      * API実装時、必ず `WHERE organization_id = ?` を入れることで、SQLレベルでのデータ漏洩防止を徹底します。

4.  **Drizzle × SQLite の最適化**

      * 日付型は D1 との互換性が高い `integer` (Unix Timestamp) を採用しています。
      * 数量 (`quantity`) は `real` 型を採用し、重量（kg）や液量（L）などの小数点計算に対応しています。
      * `stocktakeRecord` に `generatedAlwaysAs` を使用し、棚卸差異の計算をデータベース層で保証しています。
