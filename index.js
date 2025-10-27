import { BaseClass } from "./src/BaseClass.js";
export { BaseClass };

/**
 * @file ./src/FireModel.js
 * @description Firestore ドキュメント用のカスタムクラスとなるベースクラス
 * - FireModel への CRUD 機能も提供します。（実態はアダプター）
 */
export default class FireModel extends BaseClass {
  /**
   * クラス名
   */
  static className = "FireModel";

  /**
   * Firestore の CRUD 機能を注入するアダプター。
   * `setAdapter` を使って `ClientAdapter` または `ServerAdapter` をセットします。
   */
  static _adapter = null;

  /**
   * FireModel にアダプターを設定します。
   * @param {Object} adapter - Firestore CRUD アダプターインスタンス
   */
  static setAdapter(adapter) {
    FireModel._adapter = adapter;
  }

  /**
   * 現在設定されている Firestore アダプターを返します。
   * @returns {Object} 設定されたアダプターインスタンス
   * @throws {Error} アダプターが未設定の場合
   */
  static getAdapter() {
    if (!FireModel._adapter) {
      throw new Error(
        "Firestore adapter is not set. Call FireModel.setAdapter first."
      );
    }
    return FireModel._adapter;
  }

  /**
   * 現在設定されている Firestore アダプターのタイプを返します。
   * @returns {'CLIENT'|'SERVER'} - Firestore アダプターのタイプを表す文字列
   */
  static get type() {
    if (FireModel._adapter) return FireModel._adapter.type;
    return null;
  }

  /**
   * FireModel の動作設定です。
   * - `setConfig()` を通じて注入されます。
   * - 例：パスプレフィックスなど。
   */
  static config = {};

  /**
   * FireModel の動作をカスタマイズします。
   *
   * @param {Object} config - FireModel に注入する設定情報
   * @param {string} [config.prefix] - Firestore ドキュメントパスに付与する prefix
   * @throws {Error} prefix のセグメント数が奇数である場合
   */
  static setConfig(config) {
    const newConfig = { ...config };

    if (newConfig.prefix) {
      // スラッシュが末尾にない場合は追加
      if (!newConfig.prefix.endsWith("/")) {
        newConfig.prefix += "/";
      }

      // 空要素除去後のセグメントを取得
      const segments = newConfig.prefix.split("/").filter(Boolean);

      // ドキュメントパスはセグメント数が偶数である必要がある
      if (segments.length % 2 !== 0) {
        throw new Error(
          `Invalid prefix path: "${newConfig.prefix}". Firestore document paths must have an even number of segments.`
        );
      }
    }

    this.config = newConfig;
  }

  /**
   * 現在の FireModel 設定を取得します。
   *
   * @returns {Object} FireModel に設定された構成情報
   */
  static getConfig() {
    return this.config;
  }

  /**
   * The base path of the Firestore collection managed by this model.
   */
  static collectionPath = "FireModel";

  /**
   * Firestore のコレクションパスを取得します。
   * - `prefix` → `config.prefix` → "" の順で優先されます。
   * - `prefix` がスラッシュで終わっていない場合、自動的に追加されます。
   * - セグメント数が奇数の prefix は Firestore のドキュメントパスとして無効です。
   * - 最初のセグメントが `collectionPath` と同じであれば prefix は無視されます。
   *
   * @param {string|null} prefix - コレクションパスに付加するプレフィックス（省略可能）
   * @returns {string} 完成された Firestore コレクションパス
   * @throws {Error} 無効な prefix（奇数セグメント）である場合
   */
  static getCollectionPath(prefix = null) {
    let effectivePrefix = prefix || this.config?.prefix || "";

    if (effectivePrefix && !effectivePrefix.endsWith("/")) {
      effectivePrefix += "/";
    }

    const segments = effectivePrefix.split("/").filter(Boolean);
    if (segments.length % 2 !== 0) {
      throw new Error(
        `Invalid prefix path: "${effectivePrefix}". Firestore document paths must have an even number of segments.`
      );
    }

    const collectionPath = this.collectionPath;

    if (segments[0] === collectionPath) {
      return collectionPath;
    }

    return `${effectivePrefix}${collectionPath}`;
  }

  /**
   * 自動採番機能の有効フラグ。
   */
  static useAutonumber = false;

  /**
   * 論理削除機能の有効フラグ。
   */
  static logicalDelete = false;

  /**
   * このモデルが親となる子コレクションの定義配列。
   * 各要素は以下の構造を持ちます：
   * - `collectionPath`: 子コレクションのパス（文字列）
   * - `field`: このモデル側のキー（フィルタリングに使用）
   * - `condition`: クエリ条件（演算子を含む配列: [フィールド, 演算子, 値]）
   * - `type`: 関連タイプ。通常は `"collection"`（それ以外を設定すると subCollection として扱われる）
   *
   * 例 / Example:
   * hasMany = [
   *   {
   *     collectionPath: "Tasks",
   *     field: "projectId",
   *     condition: ["projectId", "==", "$docId"],
   *     type: "collection"
   *   }
   * ];
   *
   * 上記は「このモデルが Project の場合、Tasks コレクションの中から projectId が一致するタスクを関連付ける」という意味です。
   */
  static hasMany = [];

  /**
   * FireModel の新しいインスタンスを作成します。
   * - `_initializeCoreProperties()` により、インスタンスの基本的な構造とシステムフィールドをセットアップします。
   * @param {Object} item - 初期化に使用する値を持つオブジェクト
   */
  constructor(item = {}) {
    super(item);

    /** リアルタイムリスナー用変数 */
    // `toObject()` で無視できるよう、enumerable を false に
    Object.defineProperty(this, "_listener", {
      value: null,
      writable: true,
      enumerable: false,
      configurable: true,
    });
    Object.defineProperty(this, "_docs", {
      value: [],
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }

  initialize(item = {}) {
    super.initialize(item);
    this._initializeCoreProperties(item);
  }
  /**
   * Firestore 用のコンバーターを提供します。
   * - Firestore との相互変換に使用します。
   * - `toFirestore`: インスタンス → プレーンオブジェクト
   * - `fromFirestore`: スナップショット → クラスインスタンス
   * @returns {Object} `toFirestore`, `fromFirestore` を持つ変換オブジェクト
   */
  static converter() {
    return {
      toFirestore: (instance) => instance.toObject(),
      fromFirestore: (snapshot) => this.fromFirestore(snapshot), // `this` はクラスを指す
    };
  }

  /**
   * Firestore スナップショットをクラスインスタンスに変換します。
   * - カスタムクラス指定がある場合、自動でインスタンス化されます。
   * - 配列内のオブジェクトにも再帰的に適用されます。
   * @param {DocumentSnapshot} snapshot - Firestore ドキュメントスナップショット
   * @returns {FireModel} インスタンス化されたオブジェクト
   * @throws {Error} スナップショットが無効な場合
   */
  static fromFirestore(snapshot) {
    const data = snapshot?.data() ?? null;

    if (!data) {
      throw new Error(
        `[FireModel.js] Argument 'snapshot' is not Firestore's valid snapshot.`
      );
    }

    const classProps = this.classProps || {}; // クラスのプロパティ定義を取得

    Object.keys(data).forEach((key) => {
      const classProp = classProps[key];

      if (
        classProp?.type === Array &&
        classProp?.customClass &&
        Array.isArray(data[key])
      ) {
        data[key] = data[key].map(
          (element) => new classProp.customClass(element)
        );
      } else if (
        classProp?.type === Object &&
        classProp?.customClass &&
        typeof data[key] === "object"
      ) {
        data[key] = new classProp.customClass(data[key]);
      }
    });

    return new this(data);
  }

  /**
   * FireModel のコアプロパティを初期化します。
   * @param {Object} item
   */
  _initializeCoreProperties(item = {}) {
    const { docId, uid, createdAt, updatedAt } = item || {};

    // docId, uid の初期化処理
    this.docId = docId || "";
    this.uid = uid || "";

    // createdAt, updatedAt の日付型変換
    this.createdAt =
      createdAt instanceof Date
        ? createdAt
        : createdAt?.toDate
        ? createdAt.toDate()
        : null;

    this.updatedAt =
      updatedAt instanceof Date
        ? updatedAt
        : updatedAt?.toDate
        ? updatedAt.toDate()
        : null;
  }

  /**
   * 現在のリアルタイムリスナー関数を取得または設定します。
   *
   * @type {Function|null}
   */
  get listener() {
    return this._listener;
  }
  set listener(v) {
    this._listener = v;
  }

  /**
   * 購読中のドキュメントデータを取得または設定します。
   *
   * @type {Array<Object>}
   */
  get docs() {
    return this._docs;
  }
  set docs(v) {
    this._docs = v;
  }

  /**
   * ドキュメント作成前に実行されるフック処理です。
   * - 通常はサブクラスでオーバーライドして使用します。
   * - このクラスでは何も行いません（デフォルト実装）。
   *
   * @returns {Promise<void>} 解決済みの Promise
   */
  beforeCreate() {
    return Promise.resolve();
  }

  /**
   * ドキュメント更新前に実行されるフック処理です。
   * - 通常はサブクラスでオーバーライドして使用します。
   * - このクラスでは何も行いません（デフォルト実装）。
   *
   * @returns {Promise<void>} 解決済みの Promise
   */
  beforeUpdate() {
    return Promise.resolve();
  }

  /**
   * ドキュメント作成前または更新前に実行されるフック処理です。
   * - 作成前、更新前で共通した処理がある場合に使用することを前提に用意された関数です。
   * - beforeCreate, beforeUpdate の直後に呼び出されます。
   * - 通常はサブクラスでオーバーライドして使用します。
   * - このクラスでは何も行いません（デフォルト実装）。
   *
   * @returns {Promise<void>} 解決済みの Promise
   */
  beforeEdit() {
    return Promise.resolve();
  }

  /**
   * ドキュメント削除前に実行されるフック処理です。
   * - 通常はサブクラスでオーバーライドして使用します。
   * - このクラスでは何も行いません（デフォルト実装）。
   *
   * @returns {Promise<void>} 解決済みの Promise
   */
  beforeDelete() {
    return Promise.resolve();
  }

  /**
   * Firestore トランザクションを使って自動採番を設定します。
   * - `Autonumbers` コレクションのドキュメントを取得し、`current` をインクリメントして採番します。
   * - 更新処理は返される関数を呼び出すことで行われます。
   *
   * @param {Object} params - パラメータオブジェクト
   * @param {Object} params.transaction - Firestore トランザクションオブジェクト（必須）
   * @param {string|null} [params.prefix=null] - コレクションパスのプレフィックス（任意）
   * @returns {Promise<Function>} 採番値を更新する関数
   * @throws {Error} ドキュメントが存在しない、無効なステータス、最大値到達時など
   */
  async setAutonumber(params = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.setAutonumber.bind(this)(params);
  }

  /**
   * Create a new document in Firestore.
   * - This function calls the adapter's `create` method.
   * @param {Object} args - Creation options.
   * @param {string} [args.docId] - Document ID to use (optional).
   * @param {boolean} [args.useAutonumber=true] - Whether to use auto-numbering.
   * @param {Object} [args.transaction] - Firestore transaction.
   * @param {Function} [args.callBack] - Callback function.
   * @param {string} [args.prefix] - Path prefix.
   * @returns {Promise<DocumentReference>} Reference to the created document.
   * @throws {Error} If creation fails or `callBack` is not a function.
   */
  async create(args = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.create.bind(this)(args);
  }

  /**
   * Get a document from Firestore by its ID and load into this instance.
   * - This function calls the adapter's `fetch` method.
   * - The class properties will be cleared if the document does not exist.
   * @param {Object} args - Fetch options.
   * @param {string} args.docId - Document ID to fetch.
   * @param {Object|null} [args.transaction=null] - Firestore transaction (optional).
   * @param {string|null} [args.prefix=null] - Path prefix (optional).
   * @returns {Promise<boolean>} True if document was found and loaded, false if not found.
   * @throws {Error} If `docId` is not specified or fetch fails.
   */
  async fetch(args = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.fetch.bind(this)(args);
  }

  /**
   * Get a document from Firestore by its ID and return as a new instance.
   * - This function calls the adapter's `fetchDoc` method.
   * @param {Object} args - Fetch options.
   * @param {string} args.docId - Document ID to fetch.
   * @param {Object|null} [args.transaction=null] - Firestore transaction (optional).
   * @param {string|null} [args.prefix=null] - Path prefix (optional).
   * @returns {Promise<Object|null>} Document data, or null if not found.
   * @throws {Error} If `docId` is not specified or fetch fails.
   */
  async fetchDoc(args = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.fetchDoc.bind(this)(args);
  }

  /**
   * クエリ条件配列から Firestore 用のクエリオブジェクトを生成します。
   * - `where`, `orderBy`, `limit` などをサポートします。
   * - 無効なクエリタイプがあるとエラーになります。
   *
   * @param {Array} constraints - クエリ条件の配列
   * @returns {Array<Object>} クエリ制約オブジェクトの配列
   * @throws {Error} 未対応または不明なクエリタイプ指定時
   */
  createQueries(constraints) {
    const adapter = FireModel.getAdapter();
    return adapter.createQueries.bind(this)(constraints);
  }

  /**
   * `tokenMap` を利用した N-Gram 検索用の Firestore クエリを生成します。
   * - 検索文字列から1〜2文字のトークンを生成し、クエリ条件を構築します。
   * - サロゲートペア文字（絵文字など）は除外されます。
   *
   * @param {string} constraints - 検索文字列
   * @returns {Array<Object>} クエリ制約オブジェクトの配列
   * @throws {Error} 空文字列が指定された場合
   */
  createTokenMapQueries(constraints) {
    const adapter = FireModel.getAdapter();
    return adapter.createTokenMapQueries.bind(this)(constraints);
  }

  /**
   * クエリに一致する Firestore ドキュメントを取得します。
   * - `constraints` が文字列の場合は `tokenMap` を使用した N-Gram 検索を行います。
   * - `constraints` が配列の場合は標準クエリ条件として扱われます。
   * - `options` を指定すれば追加条件の付与が可能です（文字列検索時のみ）。
   *
   * @param {Object} params - パラメータオブジェクト
   * @param {Array|string} params.constraints - 検索条件または文字列
   * @param {Array} params.options - 追加のクエリ条件（省略可）
   * @param {Object|null} [params.transaction=null] - Firestore トランザクション
   * @param {string|null} [params.prefix=null] - パスのプレフィックス
   * @returns {Promise<Array<Object>>} 取得されたドキュメント配列
   * @throws {Error} クエリが無効または取得に失敗した場合
   */
  async fetchDocs(args = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.fetchDocs.bind(this)(args);
  }

  /**
   * 指定されたドキュメント ID の配列に該当するドキュメントを取得して返します。
   * - `prefix` が指定されている場合は、コレクションパスの解決に使用されます。
   * @param {Object} args - Fetch options.
   * @param {Array<string>} args.ids - Document ID の配列。
   * @param {Object|null} [args.transaction=null] - Firestore transaction (optional).
   * @param {string|null} [args.prefix=null] - Optional Firestore path prefix.
   * @returns {Promise<Array<Object>>} Array of document data.
   */
  async fetchDocsByIds(args = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.fetchDocsByIds.bind(this)(args);
  }

  /**
   * インスタンスの内容で Firestore ドキュメントを更新します。
   * - `transaction` が指定されていればそれを使用します。
   * - `callBack` で独自の処理を注入可能です。
   *
   * @param {Object} args - パラメータオブジェクト
   * @param {Function|null} [args.transaction=null] - Firestore トランザクション関数
   * @param {Function|null} [args.callBack=null] - カスタム処理用コールバック
   * @param {string|null} [args.prefix=null] - パスのプレフィックス
   * @returns {Promise<DocumentReference>} 更新されたドキュメントの参照
   * @throws {Error} 更新処理に失敗した場合
   */
  async update(args = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.update.bind(this)(args);
  }

  /**
   * このドキュメントに依存する子コレクションが存在するかを確認します。
   * - `hasMany` 定義をもとに Firestore 上に存在するか検証します。
   * - 判定ロジックはアダプターに委譲されます。
   *
   * @param {Object} args - パラメータオブジェクト
   * @param {Object|null} [args.transaction=null] - Firestore トランザクション（任意）
   * @param {string|null} [args.prefix=null] - パスのプレフィックス
   * @returns {Promise<Object|boolean>} 子が存在すればその定義、なければ false
   * @throws {Error} アダプターでの検証に失敗した場合
   */
  async hasChild(args = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.hasChild.bind(this)(args);
  }

  /**
   * Firestore ドキュメントを削除またはアーカイブに移動します。
   * - `logicalDelete` が true の場合は `archive` コレクションに移動されます。
   * - `callBack` により削除前の処理を挿入できます。
   *
   * @param {Object} args - パラメータオブジェクト
   * @param {Object|null} [args.transaction=null] - Firestore トランザクション
   * @param {Function|null} [args.callBack=null] - カスタム削除処理用コールバック
   * @param {string|null} [args.prefix=null] - パスのプレフィックス
   * @returns {Promise<void>} 削除または移動が完了したときに解決される Promise
   * @throws {Error} 削除処理に失敗した場合
   */
  async delete(args = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.delete.bind(this)(args);
  }

  /**
   * アーカイブされたドキュメントを復元します。
   * - `archive` コレクションから元のパスにドキュメントを移動します。
   * - パスの復元には `prefix` が使用されます。
   *
   * @param {Object} args - パラメータオブジェクト
   * @param {string} args.docId - 復元対象のドキュメント ID
   * @param {string|null} [args.prefix=null] - パスのプレフィックス
   * @param {Object|null} [args.transaction=null] - Firestore トランザクションオブジェクト
   * @returns {Promise<DocumentReference>} 復元されたドキュメントの参照
   * @throws {Error} `docId` が指定されていない、またはドキュメントが存在しない場合
   */
  async restore(args = {}) {
    const adapter = FireModel.getAdapter();
    return await adapter.restore.bind(this)(args);
  }

  /**
   * Firestore のリアルタイムリスナーを解除します。
   * - インスタンスが保持しているリスナーが存在する場合、解除されます。
   * - 登録済みリスナーは `listener` プロパティに保持されています。
   */
  unsubscribe() {
    const adapter = FireModel.getAdapter();
    adapter.unsubscribe.bind(this)();
  }

  /**
   * 指定したドキュメントにリアルタイムリスナーを設定します。
   * - 既存のリスナーが存在すれば解除してから再設定します。
   * - ドキュメントの変更はインスタンスに即時反映されます。
   *
   * @param {Object} args - パラメータオブジェクト
   * @param {string} args.docId - 購読対象のドキュメント ID
   * @param {string|null} [args.prefix=null] - パスのプレフィックス
   * @throws {Error} `docId` が指定されていない場合
   */
  subscribe(args = {}) {
    const adapter = FireModel.getAdapter();
    adapter.subscribe.bind(this)(args);
  }

  /**
   * Sets a real-time listener on a Firestore collection and monitors changes.
   * - If `constraints` is a string, performs N-gram search using `tokenMap`.
   * - If `constraints` is an array, applies Firestore query conditions.
   * - If `prefix` is provided, it is used to resolve the collection path.
   *
   * @param {Object} args - Subscribe options.
   * @param {Array|string} args.constraints - Query condition array or search string.
   * @param {Array} [args.options=[]] - Additional query conditions.
   * @param {string|null} [args.prefix=null] - Optional path prefix.
   * @param {function|null} [args.callback=null] - [deprecated] Callback executed on document changes.
   * @param {function|null} [callback=null] - Callback executed on document changes (moved from args).
   * @returns {Array<Object>} Live-updated document data.
   */
  subscribeDocs(args = {}, callback = null) {
    const adapter = FireModel.getAdapter();
    return adapter.subscribeDocs.bind(this)(args, callback);
  }
}
