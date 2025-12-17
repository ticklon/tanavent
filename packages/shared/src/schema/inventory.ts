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
