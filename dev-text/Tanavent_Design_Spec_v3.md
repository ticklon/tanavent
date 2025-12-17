# 🎨 Tanavent - Design & UI Specification v3.0

## 1\. Design Philosophy

### 1.1. Core Concepts

  * **Context-Aware Visibility:** 飲食店（厨房・倉庫）は「照明が暗い」「動きが激しい」環境です。装飾的な美しさよりも、**「高コントラスト」** と **「大きなタップ領域」** を最優先します。
  * **System Native Performance:** Webフォント（Google Fonts等）は使用しません。各OS標準のゴシック体を使用し、レンダリング速度を最速化します。
  * **Single-Handed Operation:** スマホ操作時、主要なアクション（保存、追加、閉じる）は片手（親指）で届く範囲、または画面下部に配置することを推奨します。

-----

## 2\. Color System (Tailwind v4 Configuration)

Tailwind CSS v4 の `@theme` ブロックを使用して定義します。
`packages/app/src/app.css` に以下の定義を配置してください。

### 2.1. Color Palette

```css
@import "tailwindcss";

@theme {
  /* --- Brand Colors --- */
  /* Main Navy: テキスト、ヘッダー、強調線 */
  --color-tanavent-navy: #011C26;
  --color-tanavent-navy-light: #1A3E4D;

  /* Primary Blue: アクションボタン、リンク、アクセント */
  --color-tanavent-blue: #0B8CBF;
  --color-tanavent-blue-hover: #0976A1;
  --color-tanavent-blue-light: #E0F2F7; /* 背景用薄色 */

  /* Success Green: 完了、在庫プラス、ポジティブな値 */
  --color-tanavent-green: #69BFA0;
  --color-tanavent-green-dark: #3D7A60;
  --color-tanavent-green-bg: #E6F7F0;

  /* Warning/Error */
  --color-tanavent-error: #EF4444;
  --color-tanavent-warning: #F59E0B;

  /* --- Neutrals --- */
  --color-surface-base: #F8FAFC;  /* アプリ背景 (Slate-50相当) */
  --color-surface-card: #FFFFFF;  /* カード・モーダル背景 */
  --color-border: #E2E8F0;        /* 境界線 (Slate-200相当) */
  --color-text-main: #0F172A;     /* 本文 (Slate-900相当) */
  --color-text-muted: #64748B;    /* 補足情報 (Slate-500相当) */
}
```

### 2.2. Semantic Usage Guide

  * **Background:** 基本は `bg-surface-base`。コンテンツ領域（リスト項目など）のみ `bg-surface-card` + `shadow-sm`。
  * **Text:** 基本は `text-text-main`。ラベルやメタ情報は `text-text-muted`。
  * **Action:** プライマリアクションは `bg-tanavent-blue`。

-----

## 3\. Typography

### 3.1. Font Stack

OS標準フォントを使用し、可読性とロード速度を確保します。

```css
@theme {
  --font-sans: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "BIZ UDPGothic", "Meiryo", "Yu Gothic", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; /* 数字・コード用 */
}
```

### 3.2. Text Hierarchy

Tailwindのユーティリティクラスを組み合わせて定義します。

| Role | Class Combination | Usage |
| :--- | :--- | :--- |
| **Page Title** | `text-xl font-bold text-tanavent-navy` | 画面最上部のタイトル |
| **Section Header** | `text-sm font-bold text-text-muted uppercase tracking-wider` | テーブルヘッダー、設定区切り |
| **Body** | `text-base font-normal text-text-main` | 一般的なテキスト |
| **Data/Number** | `font-mono font-medium` | 在庫数、金額、ID |
| **Label/Meta** | `text-xs text-text-muted` | 補足情報、データラベル |

-----

## 4\. UI Components

### 4.1. Buttons & Touch Targets

**ルール:** すべてのインタラクティブ要素は、最低 **44x44px** のヒットエリアを持つ必要があります。

  * **Primary Button:**
      * Class: `bg-tanavent-blue text-white rounded-lg h-12 px-6 font-bold shadow-sm active:scale-95 transition-transform`
      * Usage: 保存、確定、新規作成
  * **Secondary Button:**
      * Class: `bg-white border border-border text-text-main rounded-lg h-12 px-6 font-medium active:bg-gray-50`
      * Usage: キャンセル、戻る、下書き保存
  * **Icon Button:**
      * Class: `p-3 rounded-full hover:bg-black/5 active:bg-black/10 text-text-muted`
      * Usage: メニュー開閉、アイテム削除（ゴミ箱アイコン）

### 4.2. Forms (Headless UI Integration)

  * **Input Field:**
      * Class: `w-full h-12 px-4 rounded-lg border border-border bg-white text-base focus:ring-2 focus:ring-tanavent-blue focus:border-transparent outline-none transition-shadow`
      * **Focus State:** 青いリングを表示し、入力中であることを明確にする。
  * **Select / Combobox:**
      * Mobile: 画面下部からせり上がる `Drawer` (Sheet) スタイルを推奨。
      * Desktop: 標準的なプルダウンメニュー。

### 4.3. Modals (Dialog)

Headless UI の `Dialog` コンポーネントを使用します。

  * **Backdrop:** `fixed inset-0 bg-tanavent-navy/20 backdrop-blur-[2px]`
  * **Panel:**
      * Class: `bg-surface-card w-full max-w-lg rounded-2xl p-6 shadow-xl`
      * **Animation:** `Transition` を使い、`scale-95 opacity-0` から `scale-100 opacity-100` へアニメーション。

-----

## 5\. Responsive Layout Strategy (The Single Source Pattern)

Tech Spec v3.0 で定義された「単一HTMLによるレスポンシブ切り替え」のデザイン詳細です。

### 5.1. Mobile View (\< 768px)

**"Card Stack Style"**

  * **Row Style:**
      * Class: `block relative w-full mb-4 p-4 rounded-xl border border-border bg-white shadow-sm`
      * **Interaction:** タップ時に背景色が `bg-tanavent-blue-light` に変化するフィードバック (`active:`) を必ず付与。
  * **Cell Style:**
      * Label: `text-xs text-text-muted font-bold absolute left-0` (擬似要素 `before` で表示)
      * Value: `text-right w-full pl-24` (ラベル分の余白を確保)
      * Separator: 各セルの間に `border-b border-dashed border-border` を引き、視認性を高める。

### 5.2. Desktop View (\>= 768px)

**"Dense Table Style"**

  * **Row Style:**
      * Class: `table-row h-14 border-b border-border hover:bg-gray-50`
      * **Density:** 一覧性を高めるため、Paddingは `px-6 py-3` 程度に抑える。
  * **Header:**
      * Class: `bg-gray-50 text-xs font-bold text-text-muted uppercase`
      * Sticky: 長いリストの場合は `sticky top-0` を適用する。

-----

## 6\. Iconography

### 6.1. Library

**Lucide React** を使用します。
線幅 (Stroke Width) は `2px` (デフォルト) または `1.5px` で統一してください。

### 6.2. Common Icons

| Action | Icon Name | Context |
| :--- | :--- | :--- |
| **Edit** | `Pencil` | 編集ボタン |
| **Delete** | `Trash2` | 削除（赤色で使用） |
| **Menu** | `Menu` | ハンバーガーメニュー |
| **Close** | `X` | モーダルを閉じる |
| **Check** | `Check` | 完了、選択済み |
| **Search** | `Search` | 検索バー |
| **Inventory** | `Package` | 在庫メニュー |
| **Stocktake** | `ClipboardList` | 棚卸メニュー |

-----

## 7\. Motion & Feedback

### 7.1. Optimistic UI Feedback

サーバー通信を待たずにUIを更新するため、ユーザーアクションに対するフィードバックは即座に行います。

  * **Add/Remove Stock:** `+` ボタンを押した瞬間、ボタン自体が一瞬縮む (`active:scale-90`) アニメーションと、数字のカウントアップを行う。
  * **Toast Notification:** 保存完了時などは、画面下部（モバイル）または右上（PC）にトーストを表示する。
      * Success: `bg-tanavent-navy text-white icon:check-circle`
      * Error: `bg-tanavent-error text-white icon:alert-circle`

### 7.2. Transitions

Tailwind の `transition-all duration-200 ease-out` を標準とします。
遅すぎるアニメーション（300ms以上）は業務ツールのリズムを損なうため禁止します。
