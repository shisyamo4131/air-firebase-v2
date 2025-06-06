# FireModel API ドキュメント

Firestore モデル定義のためのベースクラス `FireModel` に関する API ドキュメントです。各種プロパティやメソッドの説明を日本語・英語併記でまとめています。

---

## 📁 クラス定数 / Static Properties

### `adapter`

Firestore の CRUD 機能を注入するアダプター。

- Firestore CRUD adapter injected into FireModel.
- 通常は `setAdapter()` で設定されます。

### `config`

FireModel の動作設定。

- Configuration object for customizing FireModel behavior.

### `collectionPath`

管理対象となる Firestore コレクションのパス。

- The base path of the Firestore collection managed by this model.

### `useAutonumber`

自動採番機能の有効フラグ。

- Enable automatic numbering using the Autonumbers document.

### `logicalDelete`

論理削除機能の有効フラグ。

- If true, documents are archived instead of permanently deleted.

### `classProps`

モデルが持つプロパティの定義オブジェクト。

- Definition of the properties that this model manages.
- 各プロパティは `type`, `default`, `required`, `customClass`, `validator` を含めることができます。

### `hasMany`

このモデルが親となる子コレクションの定義配列。

- Defines child collections that depend on this model's documents.

### `tokenFields`

`tokenMap` を生成する対象フィールドのリスト。

- List of fields used to generate a `tokenMap` for N-Gram search.

---

## 📦 インスタンスフィールド / Instance Properties

### `docId`, `uid`

Firestore のドキュメント ID、およびユーザーなどの関連 ID。

- Document ID and user/entity identifier.

### `createdAt`, `updatedAt`

作成日時と最終更新日時。

- Creation and last update timestamps.

### `listener`

リアルタイムリスナー関数。

- Firestore unsubscribe function for document listener.

### `docs`

`subscribeDocs()` によって購読されているドキュメントの配列。

- Array of documents being observed in real-time.

---

## 🔧 メソッド / Methods

_（代表的なメソッド一覧と解説。詳細はコードベース参照）_

- `setAdapter(adapter)`：アダプターを設定
- `getAdapter()`：アダプター取得
- `setConfig(config)`：設定の注入
- `getConfig()`：設定の取得
- `getCollectionPath(prefix)`：プレフィックス付きパス取得

- `create()`：ドキュメント作成
- `fetch()` / `fetchDoc()`：取得して自身に反映 / 新インスタンス返却
- `update()`：Firestore に更新
- `delete()`：削除またはアーカイブ
- `restore()`：アーカイブから復元

- `subscribe()` / `unsubscribe()`：ドキュメント購読の開始・停止
- `subscribeDocs()`：コレクション購読
- `createTokenMapQueries()`：N-Gram 検索条件作成
- `validate()`：モデルバリデーション

---

最終更新日: 2025 年 3 月 26 日
