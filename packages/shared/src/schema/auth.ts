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
export const userRelations = relations(user, ({ one }) => ({}));

export const memberRelations = relations(member, ({ one }) => ({
    organization: one(organization, {
        fields: [member.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [member.userId],
        references: [user.id],
    }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
    members: many(member),
}));
