import { BaseClass } from "./src/BaseClass.js";

export default class FireModel extends BaseClass {
  /**
   * Firestore の CRUD 機能を注入するアダプター。
   * Firestore CRUD adapter injected into FireModel.
   *
   * - 通常は `setAdapter()` で設定されます。
   * - ClientAdapter または ServerAdapter を受け入れます。
   */
  static _adapter = null; // Renamed to avoid conflict with potential instance property
  static get type() {
    // Add static keyword here
    if (FireModel._adapter) {
      return FireModel._adapter.type; // Access as a property, not a function
    }
    return null; // Or undefined, or throw an error if adapter must be set
  }

  /**
   * FireModel の動作設定。
   * Configuration object for customizing FireModel behavior.
   *
   * - `setConfig()` を通じて注入されます。
   * - 例：パスプレフィックスなど。
   */
  static config = {};

  /**
   * FireModel の動作をカスタマイズします。
   * Customize the behavior of FireModel.
   *
   * @param {Object} config - FireModel に注入する設定情報 / Configuration object for FireModel.
   * @param {string} [config.prefix] - Firestore ドキュメントパスに付与する prefix / Optional prefix for Firestore paths.
   * @throws {Error} prefix のセグメント数が奇数である場合 / If prefix has an odd number of path segments.
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
   * Get the current configuration for FireModel.
   *
   * @returns {Object} FireModel に設定された構成情報 / Current FireModel configuration.
   */
  static getConfig() {
    return this.config;
  }

  /**
   * 管理対象となる Firestore コレクションのパス。
   * The base path of the Firestore collection managed by this model.
   */
  static collectionPath = "FireModel";

  /**
   * Firestore のコレクションパスを取得します。
   * Get the Firestore collection path for this model.
   *
   * - `prefix` → `config.prefix` → "" の順で優先されます。
   * - `prefix` がスラッシュで終わっていない場合、自動的に追加されます。
   * - セグメント数が奇数の prefix は Firestore のドキュメントパスとして無効です。
   * - 最初のセグメントが `collectionPath` と同じであれば prefix は無視されます。
   *
   * - `prefix` is prioritized over `config.prefix` and then "".
   * - If `prefix` does not end with "/", it will be appended automatically.
   * - A prefix with an odd number of segments is invalid for Firestore document paths.
   * - If the first segment of the prefix matches `collectionPath`, the prefix is ignored.
   *
   * @param {string|null} prefix - コレクションパスに付加するプレフィックス（省略可能）/ Optional prefix for the collection path.
   * @returns {string} 完成された Firestore コレクションパス / Final resolved Firestore collection path.
   * @throws {Error} 無効な prefix（奇数セグメント）である場合 / If the prefix is an invalid Firestore document path.
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
   * Enable automatic numbering using the Autonumbers document.
   */
  static useAutonumber = false;

  /**
   * 論理削除機能の有効フラグ。
   * If true, documents are archived instead of permanently deleted.
   */
  static logicalDelete = false;

  /**
   * モデルが持つプロパティの定義オブジェクト。
   * Definition of the properties that this model manages.
   *
   * 各プロパティに以下の構成が指定できます：
   * Each property may define the following fields:
   *
   * - `type`: プロパティのデータ型（String, Number, Boolean, Object, Array）
   *           Type of the property (e.g., String, Number, Boolean, Object, Array)
   *
   * - `default`: 初期値または初期化関数
   *              Default value or a function that returns the default
   *
   * - `required`: ドキュメント作成・更新時に必須かどうか（省略可）
   *               Whether the field is required during create/update (optional)
   *
   * - `customClass`: type が Object または Array の場合、オブジェクトを指定クラスのインスタンスに変換
   *                  If `type` is Object or Array, converts data to the given class instance
   *
   * - `validator`: 値に対して追加のバリデーション関数を適用
   *                A function to apply custom validation to the value
   *
   * 例 / Example:
   * classProps = {
   *   name: { type: String, default: "", required: true },
   *   age: { type: Number, default: 0 },
   *   isActive: { type: Boolean, default: false },
   *   address: { type: Object, default: {}, customClass: Address },
   *   tags: { type: Array, default: () => [], customClass: Tag }
   * };
   */
  static classProps = {};

  /**
   * classProps に定義されたプロパティ定義情報を配列にして返します。
   */
  static get schema() {
    return Object.entries(this.classProps).map(([key, value]) => {
      return { key, ...value };
    });
  }

  /**
   * このモデルが親となる子コレクションの定義配列。
   * Defines child collections that depend on this model's documents.
   *
   * 各要素は以下の構造を持ちます：
   * Each element is an object with the following structure:
   *
   * - `collectionPath`: 子コレクションのパス（文字列）
   *                     Path to the child collection (string)
   *
   * - `field`: このモデル側のキー（フィルタリングに使用）
   *            Key in this model used for filtering (string)
   *
   * - `condition`: クエリ条件（演算子を含む配列: [フィールド, 演算子, 値]）
   *                Query condition using Firestore syntax: [field, operator, value]
   *
   * - `type`: 関連タイプ。通常は `"hasMany"`（将来的には `"hasOne"` 等も想定可）
   *           Relation type — typically `"hasMany"` (future support for `"hasOne"` possible)
   *
   * 例 / Example:
   * hasMany = [
   *   {
   *     collectionPath: "Tasks",
   *     field: "projectId",
   *     condition: ["projectId", "==", "$docId"],
   *     type: "hasMany"
   *   }
   * ];
   *
   * 上記は「このモデルが Project の場合、Tasks コレクションの中から projectId が一致するタスクを関連付ける」という意味です。
   * The example links Tasks to this model (e.g., Project) where projectId matches the document ID.
   */
  static hasMany = [];

  /**
   * 現在のリアルタイムリスナー関数を取得または設定します。
   * Get or set the current Firestore listener function.
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
   * Get or set the array of documents being observed in real-time.
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
   * FireModel にアダプターを設定します。
   * Set the Firestore adapter to use in FireModel.
   *
   * - アダプターは Firestore の CRUD 操作を担当します。
   * - 通常、ClientAdapter または ServerAdapter のいずれかを渡します。
   *
   * - Adapter handles Firestore CRUD operations.
   * - Typically, you provide either a ClientAdapter or ServerAdapter.
   *
   * @param {Object} adapter - Firestore CRUD アダプターインスタンス / Firestore CRUD adapter instance.
   */
  static setAdapter(adapter) {
    FireModel._adapter = adapter;
  }

  /**
   * 現在設定されている Firestore アダプターを取得します。
   * Get the Firestore adapter currently set in FireModel.
   *
   * @returns {Object} 設定されたアダプターインスタンス / Configured adapter instance.
   * @throws {Error} アダプターが未設定の場合 / If no adapter has been set via `setAdapter()`.
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
   * FireModel の新しいインスタンスを作成します。
   * - `_initializeCoreProperties()` により、インスタンスの基本的な構造とシステムフィールドをセットアップします。
   * - `initialize()` により、`classProps` の定義と渡された `item` の値に基づいてプロパティを初期化します。
   * @param {Object} item - 初期化に使用する値を持つオブジェクト / Object containing initial property values.
   */
  constructor(item = {}) {
    super();
    this._initializeCoreProperties();
    this.initialize(item || {});
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
   * プロパティを `classProps` の定義に基づいて初期化します。
   *
   * - `docId`, `uid`, `createdAt`, `updatedAt` は常にセットされます。
   * - `createdAt`, `updatedAt` は Date オブジェクトに変換されます。
   * - カスタムクラスや配列も適切に変換・コピーされます。
   * - 初期状態は `_beforeData` に保持されます。
   *
   * 2025-06-04
   * - classProp.type で Date は許容しないこと。
   * - Firestore の日付フィールドは timestamp 型であり、JS の Date オブジェクトとは似て非なるもの。
   * - アプリ側と Firestoe 側とでデータを対応させることを前提にすると Object として扱うことが最良と思われる。
   *
   * @param {Object} item - 初期化に使用する値のオブジェクト / Object containing initial values.
   */
  initialize(item = {}) {
    // 初期化処理
    const { docId, uid, createdAt, updatedAt, ...data } = item || {};

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

    this._setDefaultValueFromClassProps();

    // createdAt, updatedAt 以外の処理
    if (data) {
      Object.keys(data).forEach((key) => {
        // classProps の定義を取得
        const classProp = this.constructor.classProps?.[key];

        if (classProp) {
          switch (classProp.type) {
            case String:
            case Number:
            case Boolean:
              this[key] = data[key];
              break;

            case Object: {
              const customClass = classProp?.customClass;
              if (customClass && data[key]) {
                this[key] = new customClass(data[key]);
              } else if (data[key] instanceof Date) {
                // Dateオブジェクトの場合はそのまま代入
                this[key] = data[key];
              } else if (data[key]?.toDate) {
                this[key] = data[key].toDate();
              } else {
                // DateでもTimestampでもないObjectの場合、ディープコピー (nullやundefinedも考慮)
                this[key] = data[key]
                  ? JSON.parse(JSON.stringify(data[key]))
                  : data[key];
              }
              break;
            }

            case Array: {
              const customClass = classProp?.customClass;
              if (Array.isArray(data[key])) {
                this[key] = customClass
                  ? data[key].map((element) => new customClass(element))
                  : JSON.parse(JSON.stringify(data[key]));
              } else {
                this[key] = [];
              }
              break;
            }

            default: {
              throw new Error(
                `[FireModel.js] Unknown type is defined at classProps. type: ${classProp.type}`
              );
            }
          }
        }
      });
    }

    // サブクラスで追加定義された初期化処理を実行
    this.afterInitialize();

    // 初期化処理完了後、編集前の状態を _beforeData プロパティとして提供
    this._beforeData = this.toObject();
  }

  /**
   * initialize メソッドの最後に呼び出されるフック。
   * サブクラスで特有のゲッタープロパティを追加するなど、
   * 追加の初期化処理を実装するために使用します。
   */
  afterInitialize() {}

  /**
   * インスタンスをプレーンなオブジェクトに変換します。
   * - BaseClass の toObject() を使用します。
   * - initialize() によって付与されている _beforeData プロパティは削除されます。
   * @returns {Object} - 変換後のプレーンオブジェクト
   *
   * @update 2025-06-27 コアの処理を BaseClass に移管
   */
  toObject() {
    const result = super.toObject();
    delete result._beforeData;
    return result;
  }

  /**
   * FireModel インスタンスが必要とする中核的なプロパティを初期化します。
   * - システムフィールド (`docId`, `uid`, `createdAt`, `updatedAt`) を初期値で設定します。
   * - 内部プロパティ (`_listener`, `_docs`) を非列挙として定義します。
   * - `tokenFields` に基づいて `tokenMap` のゲッター/セッターも自動的に定義されます。
   * - このメソッドは、コンストラクタ内で `initialize` メソッドがユーザー定義の `classProps` や
   *   入力データを処理する前に、インスタンスの基本的な構造を準備します。
   */
  _initializeCoreProperties() {
    /** Firestore のドキュメントID */
    this.docId = "";

    /** ドキュメントの最終更新者を表す ID */
    this.uid = "";

    /** ドキュメントの作成日時 */
    this.createdAt = null;

    /** ドキュメントの更新日時 */
    this.updatedAt = null;

    /** リアルタイムリスナー用変数 */
    // `toObject()` で無視できるよう、enumerable を false に
    Object.defineProperty(this, "_listener", {
      value: null,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    /** 購読中のドキュメント配列 */
    // `toObject()` で無視できるよう、enumerable を false に */
    Object.defineProperty(this, "_docs", {
      value: [],
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }

  /**
   * `classProps` に基づいてプロパティの値を検証します。
   * Validate property values based on `classProps` definitions.
   *
   * - `required` フィールドの存在確認を行います。
   * - 型の整合性、カスタムバリデータの実行も行われます。
   *
   * - Ensures required fields are present.
   * - Verifies type correctness and runs custom validators.
   *
   * @throws {Error} 必須フィールドの欠落やバリデーション失敗時にスローされます / Throws if validation fails or required fields are missing.
   */
  validate() {
    Object.entries(this.constructor.classProps).forEach(([key, config]) => {
      const { type, required, validator } = config;

      switch (type) {
        case String:
        case Number:
        case Object: {
          const isValueMissing =
            this[key] === undefined || this[key] === null || this[key] === "";
          if (required && isValueMissing) {
            throw new Error(`${key} is required.`);
          }
          break;
        }

        case Array: {
          if (
            required &&
            (!Array.isArray(this[key]) || this[key].length === 0)
          ) {
            throw new Error(`${key} requires one or more elements.`);
          }
          break;
        }

        case Boolean:
          // Typically nothing to validate here unless a custom validator is provided.
          break;

        default:
          throw new Error(
            `Unknown type is defined at classProps. type: ${config.type}`
          );
      }

      // Custom validator check
      if (validator && !validator(this[key])) {
        throw new Error(`Invalid value at ${key}. value: ${this[key]}`);
      }
    });
  }

  /**
   * インスタンスの各プロパティの値を classProps の default で
   * 定義されている値に更新します。
   * - classProps に定義されていてインスタンスに実装されていない
   *   プロパティが存在すれば、ここで実装されます。
   */
  _setDefaultValueFromClassProps() {
    const classProps = this.constructor.classProps || {};
    Object.keys(classProps).forEach((key) => {
      const propConfig = classProps[key];
      const defaultValue = propConfig.default;
      this[key] =
        typeof defaultValue === "function" ? defaultValue() : defaultValue;
    });
  }

  /**
   * ドキュメント作成前に実行されるフック処理です。
   * Hook executed before creating a document.
   *
   * - 通常はサブクラスでオーバーライドして使用します。
   * - このクラスでは何も行いません（デフォルト実装）。
   *
   * - Intended to be overridden by subclasses.
   * - No operation in the base class.
   *
   * @returns {Promise<void>} 解決済みの Promise / A resolved Promise.
   */
  beforeCreate() {
    return Promise.resolve();
  }

  /**
   * ドキュメント更新前に実行されるフック処理です。
   * Hook executed before updating a document.
   *
   * - 通常はサブクラスでオーバーライドして使用します。
   * - このクラスでは何も行いません（デフォルト実装）。
   *
   * - Intended to be overridden by subclasses.
   * - No operation in the base class.
   *
   * @returns {Promise<void>} 解決済みの Promise / A resolved Promise.
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
   * @returns {Promise<void>} 解決済みの Promise / A resolved Promise.
   */
  beforeEdit() {
    return Promise.resolve();
  }

  /**
   * ドキュメント削除前に実行されるフック処理です。
   * Hook executed before deleting a document.
   *
   * - 通常はサブクラスでオーバーライドして使用します。
   * - このクラスでは何も行いません（デフォルト実装）。
   *
   * - Intended to be overridden by subclasses.
   * - No operation in the base class.
   *
   * @returns {Promise<void>} 解決済みの Promise / A resolved Promise.
   */
  beforeDelete() {
    return Promise.resolve();
  }

  /**
   * Firestore トランザクションを使って自動採番を設定します。
   * Set an auto-generated number using Firestore transaction.
   *
   * - `Autonumbers` コレクションのドキュメントを取得し、`current` をインクリメントして採番します。
   * - 更新処理は返される関数を呼び出すことで行われます。
   *
   * - Fetches and increments a document in the `Autonumbers` collection.
   * - Returns a function that updates the counter when called.
   *
   * @param {Object} params - パラメータオブジェクト / Parameter object.
   * @param {Object} params.transaction - Firestore トランザクションオブジェクト（必須）/ Firestore transaction object (required).
   * @param {string|null} [params.prefix=null] - コレクションパスのプレフィックス（任意）/ Optional Firestore path prefix.
   * @returns {Promise<Function>} 採番値を更新する関数 / A function that updates the `current` value.
   * @throws {Error} ドキュメントが存在しない、無効なステータス、最大値到達時など / If no doc exists, status is false, or max value is reached.
   */
  async setAutonumber({ transaction, prefix = null }) {
    const adapter = FireModel.getAdapter();
    return await adapter.setAutonumber.bind(this)({ transaction, prefix });
  }

  /**
   * Firestore に新しいドキュメントを作成します。
   * Create a new document in Firestore.
   *
   * - `transaction` が指定されない場合、自動で生成されます。
   * - `useAutonumber` が有効な場合、`setAutonumber()` が実行されます。
   * - 作成後、コールバックが指定されていれば実行されます。
   *
   * - Automatically uses transaction.
   * - Calls `setAutonumber()` if enabled.
   * - Runs callback after document creation if provided.
   *
   * @param {Object} args - パラメータオブジェクト / Parameters for document creation.
   * @param {string|null} [args.docId=null] - 作成するドキュメントの ID / Document ID (optional).
   * @param {boolean} [args.useAutonumber=true] - 自動採番を使用するかどうか / Whether to use auto-numbering.
   * @param {Object|null} [args.transaction=null] - Firestore トランザクション / Firestore transaction object.
   * @param {Function|null} [args.callBack=null] - コールバック関数 / Callback to run after creation.
   * @param {string|null} [args.prefix=null] - パスのプレフィックス / Firestore path prefix.
   * @returns {Promise<DocumentReference>} 作成されたドキュメントの参照 / Reference to the created document.
   * @throws {Error} コールバックが関数でない、書き込み失敗など / If callback is not a function or write fails.
   */
  async create({
    docId = null,
    useAutonumber = true,
    transaction = null,
    callBack = null,
    prefix = null,
  } = {}) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.create.bind(this)({
        docId,
        useAutonumber,
        transaction,
        callBack,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - create] ${err.message}`);
      throw err;
    }
  }

  /**
   * Firestore からドキュメントを取得し、インスタンスに読み込みます。
   * Fetch a Firestore document and load it into this instance.
   *
   * - `transaction` が指定されていればそれを使用します。
   * - ドキュメントが存在しない場合、初期状態にリセットされます。
   *
   * - Uses transaction if provided.
   * - If no document is found, instance is reset.
   *
   * @param {Object} args - パラメータオブジェクト / Parameter object.
   * @param {string} args.docId - 取得するドキュメントの ID / ID of the document to fetch.
   * @param {Object|null} [args.transaction=null] - トランザクションオブジェクト / Firestore transaction object (optional).
   * @param {string|null} [args.prefix=null] - パスのプレフィックス / Firestore path prefix (optional).
   * @returns {Promise<boolean>} 取得成功時は true、失敗時は false / True if document exists, otherwise false.
   * @throws {Error} `docId` が未指定または取得エラー時 / If `docId` is missing or fetch fails.
   */
  async fetch({ docId, transaction = null, prefix = null }) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.fetch.bind(this)({
        docId,
        transaction,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - fetch] ${err.message}`);
      throw err;
    }
  }

  /**
   * Firestore からドキュメントを取得し、新しいインスタンスとして返します。
   * Fetch a Firestore document and return it as a new instance.
   *
   * - `fetch()` は現在のインスタンスを更新しますが、`fetchDoc()` は新しいオブジェクトを返します。
   * - `transaction` を使用することも可能です。
   *
   * - Unlike `fetch()`, this does not modify the current instance.
   * - Can be used within a Firestore transaction.
   *
   * @param {Object} args - パラメータオブジェクト / Parameter object.
   * @param {string} args.docId - 取得するドキュメント ID / ID of the document to fetch.
   * @param {Object|null} [args.transaction=null] - Firestore トランザクション（省略可）/ Optional Firestore transaction.
   * @param {string|null} [args.prefix=null] - パスのプレフィックス / Optional Firestore path prefix.
   * @returns {Promise<Object|null>} ドキュメントのデータ、存在しない場合は null / The fetched data object or null if not found.
   * @throws {Error} `docId` が未指定または取得失敗時 / If `docId` is missing or fetch fails.
   */
  async fetchDoc({ docId, transaction = null, prefix = null }) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.fetchDoc.bind(this)({
        docId,
        transaction,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - fetchDoc] ${err.message}`);
      throw err;
    }
  }

  /**
   * クエリ条件配列から Firestore 用のクエリオブジェクトを生成します。
   * Convert query constraints into Firestore query objects.
   *
   * - `where`, `orderBy`, `limit` などをサポートします。
   * - 無効なクエリタイプがあるとエラーになります。
   *
   * - Supports Firestore query operations like `where`, `orderBy`, and `limit`.
   *
   * @param {Array} constraints - クエリ条件の配列 / Array of Firestore query conditions.
   * @returns {Array<Object>} クエリ制約オブジェクトの配列 / Array of Firestore query constraint objects.
   * @throws {Error} 未対応または不明なクエリタイプ指定時 / If an unknown or unsupported query type is specified.
   */
  createQueries(constraints) {
    const adapter = FireModel.getAdapter();
    return adapter.createQueries.bind(this)(constraints);
  }

  /**
   * `tokenMap` を利用した N-Gram 検索用の Firestore クエリを生成します。
   * Create Firestore N-Gram queries using `tokenMap`.
   *
   * - 検索文字列から1〜2文字のトークンを生成し、クエリ条件を構築します。
   * - サロゲートペア文字（絵文字など）は除外されます。
   *
   * - Generates single and double-character tokens for search.
   * - Surrogate pairs are removed for compatibility with Firestore.
   *
   * @param {string} constraints - 検索文字列 / The search string.
   * @returns {Array<Object>} クエリ制約オブジェクトの配列 / Array of Firestore query constraints.
   * @throws {Error} 空文字列が指定された場合 / If the search string is empty.
   */
  createTokenMapQueries(constraints) {
    const adapter = FireModel.getAdapter();
    return adapter.createTokenMapQueries.bind(this)(constraints);
  }

  /**
   * クエリに一致する Firestore ドキュメントを取得します。
   * Fetch Firestore documents matching query conditions.
   *
   * - `constraints` が文字列の場合は `tokenMap` を使用した N-Gram 検索を行います。
   * - `constraints` が配列の場合は標準クエリ条件として扱われます。
   * - `options` を指定すれば追加条件の付与が可能です（文字列検索時のみ）。
   *
   * - Uses N-Gram if `constraints` is a string.
   * - Uses standard Firestore query constraints if `constraints` is an array.
   *
   * @param {Object} params - パラメータオブジェクト / Parameter object.
   * @param {Array|string} params.constraints - 検索条件または文字列 / Query array or search string.
   * @param {Array} params.options - 追加のクエリ条件（省略可）/ Additional constraints (optional).
   * @param {Object|null} [params.transaction=null] - Firestore トランザクション / Optional transaction.
   * @param {string|null} [params.prefix=null] - パスのプレフィックス / Optional Firestore path prefix.
   * @returns {Promise<Array<Object>>} 取得されたドキュメント配列 / Array of matching document instances.
   * @throws {Error} クエリが無効または取得に失敗した場合 / If query is invalid or fetch fails.
   */
  async fetchDocs({
    constraints = [],
    options = [],
    transaction = null,
    prefix = null,
  } = {}) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.fetchDocs.bind(this)({
        constraints,
        options,
        transaction,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - fetchDocs] ${err.message}`);
      throw err;
    }
  }

  /**
   * インスタンスの内容で Firestore ドキュメントを更新します。
   * Update the Firestore document with current instance values.
   *
   * - `transaction` が指定されていればそれを使用します。
   * - `callBack` で独自の処理を注入可能です。
   *
   * - Updates the document using a transaction if provided.
   * - Callback can be used for custom logic (e.g., computed fields).
   *
   * @param {Object} args - パラメータオブジェクト / Parameter object.
   * @param {Function|null} [args.transaction=null] - Firestore トランザクション関数 / Optional transaction.
   * @param {Function|null} [args.callBack=null] - カスタム処理用コールバック / Optional callback.
   * @param {string|null} [args.prefix=null] - パスのプレフィックス / Optional Firestore path prefix.
   * @returns {Promise<DocumentReference>} 更新されたドキュメントの参照 / Reference to the updated document.
   * @throws {Error} 更新処理に失敗した場合 / If the update operation fails.
   */
  async update({ transaction = null, callBack = null, prefix = null } = {}) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.update.bind(this)({
        transaction,
        callBack,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - update] ${err.message}`);
      throw err;
    }
  }

  /**
   * このドキュメントに依存する子コレクションが存在するかを確認します。
   * Check if this document has any dependent child collections.
   *
   * - `hasMany` 定義をもとに Firestore 上に存在するか検証します。
   * - 判定ロジックはアダプターに委譲されます。
   *
   * - Uses `hasMany` to determine dependencies.
   * - Actual query is delegated to the adapter.
   *
   * @param {Object} args - パラメータオブジェクト / Parameter object.
   * @param {Object|null} [args.transaction=null] - Firestore トランザクション（任意）/ Optional transaction.
   * @param {string|null} [args.prefix=null] - パスのプレフィックス / Optional Firestore path prefix.
   * @returns {Promise<Object|boolean>} 子が存在すればその定義、なければ false / Definition object or false.
   * @throws {Error} アダプターでの検証に失敗した場合 / If adapter fails to check for children.
   */
  async hasChild({ transaction = null, prefix = null } = {}) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.hasChild.bind(this)({
        transaction,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - hasChild] ${err.message}`);
      throw err;
    }
  }

  /**
   * Firestore ドキュメントを削除またはアーカイブに移動します。
   * Delete the Firestore document or move it to archive.
   *
   * - `logicalDelete` が true の場合は `archive` コレクションに移動されます。
   * - `callBack` により削除前の処理を挿入できます。
   *
   * - Moves to archive if `logicalDelete` is enabled.
   * - Supports a callback for pre-deletion logic.
   *
   * @param {Object} args - パラメータオブジェクト / Parameter object.
   * @param {Object|null} [args.transaction=null] - Firestore トランザクション / Optional transaction.
   * @param {Function|null} [args.callBack=null] - カスタム削除処理用コールバック / Optional custom logic before deletion.
   * @param {string|null} [args.prefix=null] - パスのプレフィックス / Optional Firestore path prefix.
   * @returns {Promise<void>} 削除または移動が完了したときに解決される Promise / Promise resolved when deletion/archive is complete.
   * @throws {Error} 削除処理に失敗した場合 / If deletion fails.
   */
  async delete({ transaction = null, callBack = null, prefix = null } = {}) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.delete.bind(this)({
        transaction,
        callBack,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - delete] ${err.message}`);
      throw err;
    }
  }

  /**
   * アーカイブされたドキュメントを復元します。
   * Restore a previously archived document back to its original collection.
   *
   * - `archive` コレクションから元のパスにドキュメントを移動します。
   * - パスの復元には `prefix` が使用されます。
   *
   * - Moves the document from `archive` back to its original collection.
   *
   * @param {Object} args - パラメータオブジェクト / Parameter object.
   * @param {string} args.docId - 復元対象のドキュメント ID / ID of the document to restore.
   * @param {string|null} [args.prefix=null] - パスのプレフィックス / Optional Firestore path prefix.
   * @returns {Promise<DocumentReference>} 復元されたドキュメントの参照 / Reference to the restored document.
   * @throws {Error} `docId` が指定されていない、またはドキュメントが存在しない場合 / If no `docId` is given or document not found.
   */
  static async restore({ docId, prefix = null }) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.restore.bind(this)({
        docId,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - restore] ${err.message}`);
      throw err;
    }
  }

  /**
   * Firestore のリアルタイムリスナーを解除します。
   * Unsubscribe from the Firestore real-time listener.
   *
   * - インスタンスが保持しているリスナーが存在する場合、解除されます。
   * - 登録済みリスナーは `listener` プロパティに保持されています。
   *
   * - Cancels any active listener stored in `listener`.
   */
  unsubscribe() {
    const adapter = FireModel.getAdapter();
    try {
      adapter.unsubscribe.bind(this)();
    } catch (err) {
      adapter.logger.error(`[FireModel.js - unsubscribe] ${err.message}`);
      throw err;
    }
  }

  /**
   * 指定したドキュメントにリアルタイムリスナーを設定します。
   * Subscribe to a Firestore document in real-time.
   *
   * - 既存のリスナーが存在すれば解除してから再設定します。
   * - ドキュメントの変更はインスタンスに即時反映されます。
   *
   * - Automatically unsubscribes before re-subscribing.
   * - Updates the instance on document changes.
   *
   * @param {Object} args - パラメータオブジェクト / Parameter object.
   * @param {string} args.docId - 購読対象のドキュメント ID / ID of the document to subscribe to.
   * @param {string|null} [args.prefix=null] - パスのプレフィックス / Optional Firestore path prefix.
   * @throws {Error} `docId` が指定されていない場合 / If `docId` is not provided.
   */
  subscribe({ docId, prefix = null }) {
    const adapter = FireModel.getAdapter();
    try {
      adapter.subscribe.bind(this)({
        docId,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - subscribe] ${err.message}`);
      throw err;
    }
  }

  /**
   * Firestore コレクションに対してリアルタイムリスナーを設定します。
   * Set up a real-time listener on a Firestore collection.
   *
   * - `constraints` が文字列であれば `tokenMap` による N-Gram 検索が行われます。
   * - 配列であれば通常の Firestore クエリ制約が使用されます。
   * - `options` は検索文字列による条件追加に使用されます。
   * - 結果は `docs` プロパティに保持されます。
   *
   * - Supports N-Gram queries if `constraints` is a string.
   * - Uses array-based constraints as standard Firestore queries.
   * - Results are stored in the `docs` array.
   *
   * @param {Object} args - パラメータオブジェクト / Parameter object.
   * @param {Array|string} args.constraints - 検索条件または検索文字列 / Query conditions or a search string.
   * @param {Array} args.options - 追加のクエリ条件（省略可能）/ Optional extra query conditions.
   * @param {string|null} [args.prefix=null] - パスのプレフィックス / Optional Firestore path prefix.
   * @returns {Array<Object>} 購読中のドキュメントデータ配列 / Array of document data being observed in real time.
   * @throws {Error} 無効なクエリタイプが指定された場合 / If an invalid query type is specified.
   */
  subscribeDocs({ constraints = [], options = [], prefix = null } = {}) {
    const adapter = FireModel.getAdapter();
    try {
      return adapter.subscribeDocs.bind(this)({
        constraints,
        options,
        prefix,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - subscribeDocs] ${err.message}`);
      throw err;
    }
  }
}
