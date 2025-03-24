/**
 * Firestore のドキュメントモデルを定義するためのベースモデルです。
 * インスタンスには必ず `docId`, `createdAt`, `updatedAt`, `uid` が含まれます。
 *
 * 《使い方》
 * 1. 管理するコレクションごとにこのクラスを継承したサブクラスを作成します。
 * 2. `collectionPath` に当該ドキュメントを保存するコレクションのパスを設定します。
 *
 * 《useAutonumber》
 *
 */
export default class FireModel {
  /**
   * An adapter that injects Firestore CRUD functionality into FireModel.
   * The setAdapter method accepts a ClientAdapter or ServerAdapter.
   *
   * FireModel に Firestore の CRUD 機能を注入するアダプターです。
   * setAdapter メソッドにより ClientAdapter または ServerAdapter を受け取ります。
   */
  static adapter = null;

  /**
   * A variable used to store settings that are injected separately from the project.
   * プロジェクトから別途注入される設定を保存するための変数です。
   */
  static config = {};

  /**
   * Customize FireModel behavior.
   * FireModel の動作をカスタマイズします。
   * @param {Object} config - FireModel に別途注入する設定情報です。
   */
  static setConfig(config) {
    FireModel.config = config;
  }

  /**
   * Returns FireModel behavior configuration data.
   * FireModel の動作設定データを返します。
   * @returns {Object} - 設定データ
   */
  static getConfig() {
    return FireModel.config;
  }

  /**
   * The collection path of the document to be managed.
   *
   * 管理するドキュメントのコレクションパスです。
   */
  static collectionPath = "FireModel";

  /**
   * Returns the Firestore collection path for this model.
   * - The path is constructed using the configured prefix and the model's collection path.
   *
   * コレクションのパスを返します。
   * - 設定されたプレフィックスと、モデルの `collectionPath` を連結して構築されます。
   *
   * @returns {string} The full Firestore collection path.
   *                   Firestore のコレクションパス。
   */
  static getCollectionPath() {
    const prefix = FireModel.config?.prefix || "";
    return `${prefix}${FireModel.collectionPath}`;
  }

  /**
   * If true, auto-numbering is performed with the contents specified in the Autonumber document.
   *
   * true にすると Autonumber ドキュメントに指定された内容で自動採番を行います。
   */
  static useAutonumber = false;

  /**
   * If true, the document will be moved to the archive collection without being deleted.
   *
   * true にするとドキュメントは削除されずに archive コレクションに移動されます。
   */
  static logicalDelete = false;

  /**
   * Data model definition. The following properties are available
   *
   * データモデルの定義です。以下のプロパティを利用可能です。
   *
   * [type]
   * - Property type.
   * - プロパティの型です。
   *
   * [default]
   * - Initial value of the property.
   * - プロパティの初期値です。
   *
   * [required]
   * - ドキュメントを作成または更新する際、値を必須とするためのフラグです。（オプション）
   * - Flag to make the value mandatory when creating or updating a document.(Optional)
   *
   * [customClass]
   * - If type is Object, the object is converted to an instance of the specified class.
   *   If type is Array, the elements (objects) in the array are converted to instances of the specified class.
   *   Other types are ignored.
   *
   * - type が Object の場合、オブジェクトが指定されたクラスのインスタンスに変換されます。
   *   type が Array の場合、配列内の要素（オブジェクト）が指定されたクラスのインスタンスに変換されます。
   *   その他の type の場合は無視されます。
   *
   * [validator]
   * - Validator applied to the property.
   * - プロパティに適用されるバリデータです。
   */
  static classProps = {};

  /**
   * The definition of a collection that depends on the collection document managed by the class in question.
   *
   * 当該クラスが管理するコレクションドキュメントに依存するコレクションの定義です。
   *
   * { collectionPath, field, condition, type }
   */
  static hasMany = [];

  /**
   * List of fields to be reflected in tokenMap.
   * Generate a tokenMap for NGram lookups to compensate for Firestore's weak queries.
   * An object is created whose key is one or two characters of the value set in the specified field.
   *
   * tokenMap に反映させるフィールドのリストです。
   * Firestore の脆弱なクエリを補う為、NGram 検索のための tokenMap を生成します。
   * 指定されたフィールドにセットされている値の 1文字 または 2文字 をキーとしたオブジェクトが生成されます。
   */
  static tokenFields = [];

  /**
   * Variable for listeners when document subscription by real-time listeners is started.
   *
   * リアルタイムリスナーによるドキュメントの購読を開始した際のリスナー用変数です。
   */
  #listener = null;
  get listener() {
    return this.#listener;
  }
  set listener(v) {
    this.#listener = v;
  }

  /**
   * An array of documents read by real-time listeners subscribing to documents.
   *
   * リアルタイムリスナーによるドキュメントの購読によって読み込まれたドキュメントの配列です。
   */
  #docs = [];
  get docs() {
    return this.#docs;
  }
  set docs(v) {
    this.#docs = v;
  }

  /**
   * Set the adapter on the FireModel.
   * FireModel にアダプターをセットします。
   * @param {ClientAdapter | ServerAdapter} adapter
   */
  static setAdapter(adapter) {
    FireModel.adapter = adapter;
  }

  /**
   * Returns the adapter currently set in FireModel.
   * FireModel に現在セットされているアダプターを返します。
   */
  static getAdapter() {
    if (!FireModel.adapter) {
      throw new Error(
        "Firestore adapter is not set. Call FireModel.setAdapter first."
      );
    }
    return FireModel.adapter;
  }

  /**
   * Constructs an instance of the class.
   * - Initializes properties based on `classProps` definitions.
   * - Calls `initialize(item)` to populate properties with provided values.
   *
   * クラスのインスタンスを生成します。
   * - `classProps` に基づいてプロパティを定義します。
   * - `initialize(item)` を呼び出し、渡された値をもとにプロパティを設定します。
   *
   * @param {Object} item - An object containing initial values for the instance properties.
   *                        インスタンスのプロパティを初期化するための値を持つオブジェクト。
   */
  constructor(item = {}) {
    // classProps に定義された内容でプロパティを用意
    this.#createProperties();

    // 初期化処理を実行
    this.initialize(item || {});
  }

  /**
   * Returns a cloned instance of the current object.
   * - Used to avoid reference sharing when returning an instance to a parent in a Vue component.
   *
   * 当該インスタンスを複製した新しいインスタンスを返します。
   * - Vue コンポーネントにおいてインスタンスを親に返す場合など、参照渡しを回避するのに使用します。
   *
   * @returns {this} A new cloned instance of the current object.
   *                 現在のオブジェクトを複製した新しいインスタンス。
   */
  clone() {
    return new this.constructor(this);
  }

  /**
   * Provides a Firestore data converter for this class.
   * - `toFirestore` converts an instance into a plain JavaScript object.
   * - `fromFirestore` converts a Firestore document snapshot into an instance of this class.
   *
   * Firestore 用のデータコンバーターを提供します。
   * - `toFirestore` はインスタンスをプレーンな JavaScript オブジェクトに変換します。
   * - `fromFirestore` は Firestore のドキュメントスナップショットを
   *   当該クラスのインスタンスに変換します。
   *
   * @returns {Object} A Firestore data converter with `toFirestore` and `fromFirestore` methods.
   *                   `toFirestore` と `fromFirestore` メソッドを持つ Firestore のデータコンバーターオブジェクト。
   */
  static converter() {
    return {
      toFirestore: (instance) => instance.toObject(),
      fromFirestore: (snapshot) => this.fromFirestore(snapshot), // `this` はクラスを指す
    };
  }

  /**
   * Converts a Firestore document snapshot into an instance of this class.
   * - The data from the snapshot is mapped to the instance properties.
   * - If a property is defined as a custom class, it will be instantiated accordingly.
   * - Arrays containing custom class objects are converted element-wise.
   *
   * Firestore から取得したドキュメントスナップショットを
   * 当該クラスのインスタンスに変換します。
   * - スナップショットのデータをインスタンスのプロパティにマッピングします。
   * - プロパティがカスタムクラスとして定義されている場合、自動的にインスタンス化します。
   * - カスタムクラスを含む配列も要素ごとに変換します。
   *
   * @param {FirebaseFirestore.DocumentSnapshot} snapshot - Firestore document snapshot to convert.
   *                                                        Firestore から取得したドキュメントスナップショット。
   * @returns {FireModel} An instance of the class with data populated from the snapshot.
   *                      Firestore スナップショットのデータを基に生成されたクラスのインスタンス。
   * @throws {Error} If the provided snapshot is invalid or contains no data.
   *                 無効なスナップショット、またはデータが存在しない場合にエラーをスローします。
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
   * Initializes the instance properties based on `classProps` definitions.
   * - If provided, the `item` object is used to populate the properties.
   * - Fields `docId`, `uid`, `createdAt`, and `updatedAt` are always initialized.
   * - `createdAt` and `updatedAt` are converted to `Date` objects if applicable.
   * - Other properties are processed based on their type definitions in `classProps`:
   *   - `String`, `Number`, `Boolean`: Directly assigned.
   *   - `Object`: Converted to an instance of a custom class if defined, otherwise deep-copied.
   *   - `Array`: Converted to instances of a custom class if defined, otherwise deep-copied.
   * - After initialization, the `_beforeData` property stores the initial state.
   *
   * クラスインスタンスの各プロパティを `classProps` の定義に基づいて初期化します。
   * - `item` オブジェクトが提供された場合、そのデータを用いてプロパティを設定します。
   * - `docId`, `uid`, `createdAt`, `updatedAt` は必ず初期化されます。
   * - `createdAt`, `updatedAt` は `Date` オブジェクトに変換されます（可能な場合）。
   * - その他のプロパティは `classProps` の型定義に応じて処理されます:
   *   - `String`, `Number`, `Boolean`: そのまま代入。
   *   - `Object`: カスタムクラスが定義されていれば変換、それ以外はディープコピー。
   *   - `Array`: カスタムクラスが定義されていれば要素ごとに変換、それ以外はディープコピー。
   * - 初期化後、元のデータを `_beforeData` プロパティに保存します。
   *
   * @param {Object} item - An object containing initial values for the instance properties.
   *                        インスタンスのプロパティにセットする初期値を持つオブジェクト。
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
              if (customClass) {
                this[key] = new customClass(data[key]);
              } else if (data[key]?.toDate) {
                this[key] = data[key].toDate();
              } else {
                this[key] = JSON.parse(JSON.stringify(data[key]));
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

    // 初期化処理完了後、編集前の状態を _beforeData プロパティとして提供
    this._beforeData = this.toObject();
  }

  /**
   * Converts the instance into a plain JavaScript object.
   * - Only `enumerable` properties are included.
   * - If a property has a `toObject()` method, it is called recursively.
   * - Arrays are processed element-wise, converting objects recursively.
   * - `_beforeData` is removed from the final object.
   *
   * 当該インスタンスをプレーンな JavaScript オブジェクトに変換します。
   * - `enumerable` なプロパティのみを含めます。
   * - プロパティが `toObject()` メソッドを持つ場合、それを再帰的に呼び出します。
   * - 配列の各要素を処理し、オブジェクトは再帰的に変換します。
   * - `_beforeData` を最終的なオブジェクトから削除します。
   *
   * @returns {Object} A plain object containing all `enumerable` properties of the instance.
   *                   インスタンスの `enumerable` なプロパティを含むプレーンなオブジェクト。
   */
  toObject() {
    // 最終的に返すオブジェクトを用意
    const obj = {};

    // 当該インスタンスのプロパティ記述子をすべて取得
    const properties = Object.getOwnPropertyDescriptors(this);
    Object.entries(properties).forEach(([key, descriptor]) => {
      // enumerable であるプロパティのみを処理
      if (descriptor.enumerable) {
        const value = this[key];

        // プロパティ値が toObject() を有していれば再帰的にこれを呼び出す
        if (typeof value?.toObject === "function") {
          obj[key] = value.toObject();
        }

        // プロパティ値が配列の場合、各要素について処理
        else if (Array.isArray(value)) {
          obj[key] = value.map((element) => {
            // 要素が toObject() を有していれば再帰的にこれを呼び出す
            if (typeof element?.toObject === "function") {
              return element.toObject();
            }

            // オブジェクトであればディープコピー
            else if (typeof element === "object" && element !== null) {
              return JSON.parse(JSON.stringify(element));
            }

            // プリミティブ型であればそのままセット
            else {
              return element;
            }
          });
        }

        // プロパティ値が toObject() を有しておらず、配列でもない場合はそのまま値をセット
        else {
          obj[key] = value;
        }
      }
    });

    // initialize で生成された _beforeData を削除して返す
    const { _beforeData, ...others } = obj;
    return others;
  }

  /**
   * Generates properties based on `classProps` definitions.
   * - The mandatory properties `docId`, `uid`, `createdAt`, and `updatedAt` are always created.
   * - If a property has a default value defined in `classProps`, it is assigned accordingly.
   * - If the default value is a function, its return value is assigned instead.
   * - If `tokenFields` contains elements, a `tokenMap` property is created with getter and setter methods.
   *
   * `classProps` に定義された内容でプロパティを生成します。
   * - `docId`, `uid`, `createdAt`, `updatedAt` は必ず作成されます。
   * - `classProps` にデフォルト値が定義されている場合、それを適用します。
   * - デフォルト値が関数の場合、その関数を実行し、戻り値を代入します。
   * - `tokenFields` に要素が含まれている場合、`tokenMap` プロパティを生成し、
   *   ゲッターおよびセッターを定義します。
   */
  #createProperties() {
    // 必須プロパティの生成
    this.docId = "";
    this.uid = "";
    this.createdAt = null;
    this.updatedAt = null;

    // classProps に定義されたプロパティを生成
    const classProps = this.constructor.classProps;
    Object.keys(classProps).forEach((key) => {
      const defaultValue = classProps[key].default;
      this[key] =
        typeof defaultValue === "function" ? defaultValue() : defaultValue;
    });

    // tokenFields が配列であり、要素が含まれている場合のみ tokenMap を生成
    if (
      Array.isArray(this.constructor.tokenFields) &&
      this.constructor.tokenFields.length
    ) {
      Object.defineProperties(this, {
        tokenMap: {
          enumerable: true,
          configurable: true,
          get: this.#generateTokenMap.bind(this),
          set: this.#setTokenMap.bind(this),
        },
      });
    }
  }

  /**
   * Validates each property value based on the definitions in `classProps`.
   * - Called before creating or updating a Firestore document.
   * - Checks for required fields, correct types, and optional custom validation functions.
   *
   * `classProps` に定義された内容で各プロパティの値の妥当性を検査します。
   * - Firestore ドキュメントの作成または更新前に呼び出されます。
   * - 必須フィールド、型の整合性、カスタムバリデーション関数などを検査します。
   *
   * @throws {Error} If any required field is missing, or if validation fails.
   *                 必須フィールドの欠落や、バリデーション不合格の場合にエラーをスローします。
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
   * Generates and returns a `tokenMap` based on the values of `tokenFields`.
   * - Creates tokens from the values of fields specified in `tokenFields`.
   * - Fields that do not exist or have empty values are ignored.
   * - Tokens are generated by removing surrogate pairs, special characters, and whitespace.
   * - Both single-character and two-character tokens are generated.
   *
   * `tokenFields` の値から `tokenMap` を生成して返します。
   * - `tokenFields` で指定されたフィールドの値からトークンを生成します。
   * - フィールドが存在しないか、値が空の場合は無視されます。
   * - サロゲートペア、特殊文字、空白を除去してトークンを生成します。
   * - 1文字および2文字単位のトークンを作成します。
   *
   * @returns {Object|null} A generated `tokenMap`. Returns `null` if no valid fields exist.
   *                        生成された `tokenMap` を返します。対象フィールドがない場合は `null` を返します。
   */
  #generateTokenMap() {
    if (
      !Array.isArray(this.constructor.tokenFields) ||
      this.constructor.tokenFields.length === 0
    ) {
      return null;
    }

    const arr = [];
    this.constructor.tokenFields.forEach((fieldName) => {
      if (
        fieldName in this &&
        typeof this[fieldName] === "string" &&
        this[fieldName].length > 0
      ) {
        const target = this[fieldName].replace(
          /[\uD800-\uDBFF]|[\uDC00-\uDFFF]|~|\*|\[|\]|\s+/g,
          ""
        );

        for (let i = 0; i < target.length; i++) {
          arr.push([target.substring(i, i + 1), true]);
        }
        for (let i = 0; i < target.length - 1; i++) {
          arr.push([target.substring(i, i + 2), true]);
        }
      }
    });

    return arr.length > 0 ? Object.fromEntries(arr) : null;
  }

  /**
   * A setter for `tokenMap`.
   * - This is a No-op (no-operation) setter to prevent errors during initialization.
   * - It can be customized to implement specific logic if needed.
   *
   * `tokenMap` のセッターです。
   * - 初期化時のエラーを避けるための No-op（何もしない）セッターです。
   * - 必要に応じて、特定のロジックを実装するためにカスタマイズできます。
   *
   * @param {Object} value - The `tokenMap` value to set (currently unused).
   *                         設定する `tokenMap` の値（現在は使用されません）。
   */
  #setTokenMap(value) {
    // No-op setter to avoid errors during initialization.
    // This can be customized if needed to handle specific logic.
  }

  /**
   * Defines a hook to be executed immediately before a document is created.
   * - Intended to be overridden by subclasses.
   * - Does nothing by default in this base class.
   *
   * ドキュメントを作成する直前に実行される処理を定義します。
   * - 継承先でオーバーライドして使用されることを想定しています。
   * - このクラスではデフォルトでは何も処理を行いません。
   *
   * @returns {Promise<void>} A resolved promise.
   *                          解決済みのプロミスを返します（デフォルト動作）。
   */
  beforeCreate() {
    return Promise.resolve();
  }

  /**
   * Defines a hook to be executed immediately before a document is updated.
   * - Intended to be overridden by subclasses.
   * - Does nothing by default in this base class.
   *
   * ドキュメントを更新する直前に実行される処理を定義します。
   * - 継承先でオーバーライドして使用されることを想定しています。
   * - このクラスではデフォルトでは何も処理を行いません。
   *
   * @returns {Promise<void>} A resolved promise.
   *                          解決済みのプロミスを返します（デフォルト動作）。
   */
  beforeUpdate() {
    return Promise.resolve();
  }

  /**
   * Defines a hook to be executed immediately before a document is deleted.
   * - Intended to be overridden by subclasses.
   * - Does nothing by default in this base class.
   *
   * ドキュメントを削除する直前に実行される処理を定義します。
   * - 継承先でオーバーライドして使用されることを想定しています。
   * - このクラスではデフォルトでは何も処理を行いません。
   *
   * @returns {Promise<void>} A resolved promise.
   *                          解決済みのプロミスを返します（デフォルト動作）。
   */
  beforeDelete() {
    return Promise.resolve();
  }

  /**
   * [ADAPTER] Assigns an auto-generated number to the instance using a Firestore transaction.
   * - Retrieves the current autonumber document from the `Autonumbers` collection.
   * - If numbering is enabled, increments the current value and assigns the new code to the instance.
   * - Returns a function that, when executed, updates the `current` value in Firestore.
   *
   * [ADAPTER] Firestore のトランザクションを使用して、インスタンスに採番を行います。
   * - `Autonumbers` コレクションから、現在の自動採番ドキュメントを取得します。
   * - 採番可能である場合、現在値をインクリメントし、新しい採番コードをインスタンスにセットします。
   * - `current` 値を更新するための関数を返します。（更新処理は呼び出し元で実行）
   *
   * @param {Object} transaction - Firestore transaction object (required).
   *                               Firestore のトランザクションオブジェクト（必須）
   * @returns {Promise<Function>} A function that updates the `current` value when called.
   *                              `current` 値を更新する関数を返します（呼び出し元で実行）。
   * @throws {Error} If no document exists for the target collection in `Autonumbers`.
   *                 `Autonumbers` コレクションに対象のドキュメントが存在しない場合。
   * @throws {Error} If autonumbering is disabled (`status: false`).
   *                 採番が無効化されている場合（`status: false`）。
   * @throws {Error} If the maximum value (`10^length - 1`) is reached.
   *                 採番の最大値（`10^length - 1`）に達した場合。
   */
  async setAutonumber(transaction) {
    const adapter = FireModel.getAdapter();
    return await adapter.setAutonumber.bind(this)(transaction);
  }

  /**
   * [ADAPTER] Creates a document in Firestore.
   * - Document creation is always executed within a Firestore transaction.
   *   If no `transaction` is provided, a new one is created inside this function.
   * - If `docId` is not specified, Firestore will assign an auto-generated ID.
   * - If `useAutonumber` is `true`, the `setAutonumber()` method will be executed.
   *   Note: The class must have `useAutonumber` set to `true` to enable autonumbering.
   * - If a `callBack` is provided, it will be executed after the document is created.
   *
   * [ADAPTER] Firestore にドキュメントを作成します。
   * - ドキュメントの作成は必ずトランザクション処理で実行されます。
   *   引数 `transaction` が与えられなかった場合、この関数内でトランザクションが生成されます。
   * - `docId` を指定しない場合、Firestore により自動で ID が割り当てられます。
   * - `useAutonumber` を `true` にすると、自動採番 (`setAutonumber()`) を実行します。
   *   但し、自動採番を行うためにはクラスの `useAutonumber` が `true` である必要があります。
   * - `callBack` が指定されている場合、ドキュメント作成後にコールバック関数を実行します。
   *
   * @param {Object} args - Parameters for creating the document.
   *                        ドキュメント作成のためのパラメータ。
   * @param {string|null} [args.docId] - ID of the document to be created (optional).
   *                                     作成するドキュメントのID（オプション）。
   * @param {boolean} [args.useAutonumber=true] - If `true`, executes auto-numbering.
   *                                              `true` の場合、自動採番を実行します。
   * @param {Object|null} [args.transaction] - Firestore transaction object.
   *                                           Firestore のトランザクションオブジェクト。
   * @param {function|null} [args.callBack] - Callback to execute after document creation.
   *                                          ドキュメント作成後に実行するコールバック関数。
   * @returns {Promise<DocumentReference>} Reference to the newly created document.
   *                                       作成されたドキュメントの参照。
   * @throws {Error} If `callBack` is not a function.
   *                 `callBack` が関数でない場合はエラーをスローします。
   * @throws {Error} If Firestore write operation fails.
   *                 Firestore への書き込みに失敗した場合はエラーをスローします。
   */
  async create({
    docId = null,
    useAutonumber = true,
    transaction = null,
    callBack = null,
  } = {}) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.create.bind(this)({
        docId,
        useAutonumber,
        transaction,
        callBack,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - create] ${err.message}`);
      throw err;
    }
  }

  /**
   * [ADAPTER] Fetches a document with the specified ID from Firestore and loads it into the instance.
   * - If the document does not exist, the instance data will be reset via `initialize(null)`.
   * - If `transaction` is provided, the document is fetched within the transaction.
   * - If `transaction` is `null`, it fetches the document using a standard `getDoc()` call.
   *
   * [ADAPTER] 指定された ID に該当するドキュメントを Firestore から取得し、インスタンスに読み込みます。
   * - ドキュメントが存在しない場合、インスタンスのデータをリセット（`initialize(null)`）します。
   * - `transaction` が指定されている場合、トランザクションを使用して取得します。
   * - `transaction` が `null` の場合、通常の `getDoc()` を使用して取得します。
   *
   * @param {string} docId - ID of the document to fetch.
   *                         取得するドキュメントの ID。
   * @param {Object|null} [transaction=null] - Firestore transaction object (optional).
   *                                           Firestore のトランザクションオブジェクト（オプション）。
   * @returns {Promise<boolean>} `true` if the document exists, `false` otherwise.
   *                             ドキュメントが存在する場合は `true`、存在しない場合は `false`。
   * @throws {Error} If `docId` is not provided or Firestore fetch fails.
   *                 `docId` が指定されていない、または Firestore の取得に失敗した場合にエラーをスローします。
   */
  async fetch(docId, transaction = null) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.fetch.bind(this)(docId, transaction);
    } catch (err) {
      adapter.logger.error(`[FireModel.js - fetch] ${err.message}`);
      throw err;
    }
  }

  /**
   * [ADAPTER] Fetches a document by ID from Firestore and returns it as a new object.
   * - Unlike `fetch()`, which sets the data on this instance, `fetchDoc()` returns a new object.
   * - If `transaction` is provided, the document is fetched within the transaction.
   * - If `transaction` is `null`, it fetches the document using a standard `getDoc()` call.
   *
   * [ADAPTER] Firestore から指定された ID に該当するドキュメントを取得し、新しいオブジェクトとして返します。
   * - `fetch()` はこのクラスのインスタンスにデータをセットしますが、`fetchDoc()` は新しいオブジェクトとして返します。
   * - `transaction` が指定されている場合、トランザクションを使用して取得します。
   * - `transaction` が `null` の場合、通常の `getDoc()` を使用して取得します。
   *
   * @param {string} docId - ID of the document to fetch.
   *                         取得するドキュメントの ID。
   * @param {Object|null} [transaction=null] - Firestore transaction object (optional).
   *                                           Firestore のトランザクションオブジェクト（オプション）。
   * @returns {Promise<Object|null>} The fetched document data as a plain object, or `null` if not found.
   *                                 取得したデータオブジェクト。ドキュメントが存在しない場合は `null`。
   * @throws {Error} If `docId` is not provided or Firestore fetch fails.
   *                 `docId` が指定されていない場合、または Firestore の取得に失敗した場合にエラーをスローします。
   */
  async fetchDoc(docId = null, transaction = null) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.fetchDoc.bind(this)(docId, transaction);
    } catch (err) {
      adapter.logger.error(`[FireModel.js - fetchDoc] ${err.message}`);
      throw err;
    }
  }

  /**
   * [ADAPTER] Converts an array of Firestore query conditions into Firestore query constraint objects.
   * - The `constraints` array can include Firestore queries like `where`, `orderBy`, and `limit`.
   * - Example: `[['where', 'age', '>=', 18], ['orderBy', 'age', 'desc'], ['limit', 10]]`
   * - Throws an error if an unknown query type is specified.
   *
   * [ADAPTER] Firestore のクエリ条件の配列を受け取り、Firestore のクエリオブジェクト配列を生成して返します。
   * - `constraints` 配列には、`where`, `orderBy`, `limit` などの Firestore クエリを指定できます。
   * - 例：`[['where', 'age', '>=', 18], ['orderBy', 'age', 'desc'], ['limit', 10]]`
   * - 不明なクエリタイプが指定された場合はエラーをスローします。
   *
   * @param {Array} constraints - Array of Firestore query conditions.
   *                              Firestore のクエリ条件の配列。
   * @returns {Array<Object>} Array of Firestore query constraint objects.
   *                          Firestore クエリオブジェクトの配列を返します。
   * @throws {Error} If an unknown query type is specified.
   *                 不明なクエリタイプが指定された場合にエラーをスローします。
   */
  createQueries(constraints) {
    const adapter = FireModel.getAdapter();
    return adapter.createQueries.bind(this)(constraints);
  }

  /**
   * [ADAPTER] Generates Firestore query objects for N-Gram search using `tokenMap`.
   * - Creates single and double character tokens from the search string to build Firestore queries.
   * - Example: `"検索"` → `['検', '索', '検索']`
   * - Surrogate pair characters (e.g., emojis) are excluded because they are not searchable in `tokenMap`.
   *
   * [ADAPTER] Firestore の `tokenMap` に基づく N-Gram 検索用のクエリオブジェクトを生成します。
   * - 検索文字列の 1 文字・2 文字ごとのトークンを作成し、Firestore の `tokenMap` を利用した検索クエリを生成します。
   * - 例：`"検索"` → `['検', '索', '検索']`
   * - サロゲートペア文字（絵文字など）は Firestore の `tokenMap` では検索対象としないため除外します。
   *
   * @param {string} constraints - The search string to generate tokens from.
   *                               検索に使用する文字列。
   * @returns {Array<Object>} Array of Firestore query constraint objects.
   *                          Firestore クエリオブジェクトの配列を返します。
   * @throws {Error} If `constraints` is an empty string.
   *                 `constraints` が空文字の場合、エラーをスローします。
   */
  createTokenMapQueries(constraints) {
    const adapter = FireModel.getAdapter();
    return adapter.createTokenMapQueries.bind(this)(constraints);
  }

  /**
   * [ADAPTER] Retrieves documents from Firestore that match the specified conditions.
   * - If `constraints` is a string, it performs N-Gram search using `tokenMap`.
   *   Additional query conditions can be specified using `options`.
   * - If `constraints` is an array, it runs a query using the provided array of conditions.
   *
   * [ADAPTER] Firestore から条件に一致するドキュメントを取得します。
   * - 引数 `constraints` が文字列であった場合、`tokenMap` による N-gram 検索が実行されます。
   *   `options` で追加の条件を指定可能です。
   * - 引数 `constraints` が配列であった場合は、配列内の各要素で指定された条件をもとにクエリを実行します。
   *
   * @param {Array|string} constraints - Query condition array or search string.
   *                                     クエリ条件の配列または検索用の文字列。
   * @param {Array} options - Additional query conditions (ignored if `constraints` is an array).
   *                          追加のクエリ条件の配列（`constraints` が配列の場合は無視されます）。
   * @param {Object|null} [transaction=null] - Firestore transaction object (optional).
   *                                           Firestore のトランザクションオブジェクト（オプション）。
   * @returns {Promise<Array<Object>>} Array of instances initialized with the fetched documents.
   *                                   取得したドキュメントで初期化されたインスタンスの配列。
   * @throws {Error} If an unknown query type is specified.
   *                 不明なクエリタイプが指定された場合にエラーをスローします。
   * @throws {Error} If the document fetch operation fails.
   *                 ドキュメントの取得に失敗した場合にエラーをスローします。
   */
  async fetchDocs({ constraints = [], options = [] }, transaction = null) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.fetchDocs.bind(this)(
        { constraints, options },
        transaction
      );
    } catch (err) {
      adapter.logger.error(`[FireModel.js - fetchDocs] ${err.message}`);
      throw err;
    }
  }

  /**
   * [ADAPTER] Updates the Firestore document using the current property values of the instance.
   *
   * [ADAPTER] Firestore ドキュメントを現在のプロパティ値で更新します。
   *
   * @param {function|null} transaction - Function for executing within a Firestore transaction (optional, default: `null`).
   *                                      Firestore のトランザクション処理を行うための関数（省略可能、デフォルトは `null`）。
   * @param {function|null} callBack - Function for executing custom logic in subclasses (optional, default: `null`).
   *                                   サブクラスで独自の処理を実行するための関数（省略可能、デフォルトは `null`）。
   * @returns {Promise<DocumentReference>} Reference to the updated Firestore document.
   *                                       更新された Firestore ドキュメントの参照。
   * @throws {Error} If an error occurs during the document update.
   *                 ドキュメント更新中にエラーが発生した場合にスローされます。
   */
  async update({ transaction = null, callBack = null } = {}) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.update.bind(this)({
        transaction,
        callBack,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - update] ${err.message}`);
      throw err;
    }
  }

  /**
   * [ADAPTER] Checks whether child documents exist based on the conditions defined in the `hasMany` property.
   *
   * [ADAPTER] `hasMany` プロパティにセットされた条件に基づき、現在のドキュメントに依存している
   * 子ドキュメントが存在しているかどうかを確認します。
   *
   * @param {function|null} transaction - Function for executing within a Firestore transaction (optional, default: `null`).
   *                                      Firestore のトランザクション処理を行うための関数（省略可能、デフォルトは `null`）。
   * @returns {Promise<object|boolean>} If child documents exist, returns the corresponding `hasMany` entry; otherwise returns `false`.
   *                                    子ドキュメントが存在する場合は `hasMany` の該当項目を返し、存在しない場合は `false` を返します。
   * @throws {Error} If an error occurs during the Firestore operation.
   *                 Firestore の操作中にエラーが発生した場合にスローされます。
   */
  async hasChild(transaction = null) {
    const adapter = FireModel.getAdapter();
    return adapter.hasChild.bind(this)(transaction);
  }

  /**
   * [ADAPTER] Deletes the document corresponding to the current document ID.
   * - If `logicalDelete` is enabled, the document is archived instead of being permanently deleted.
   *
   * [ADAPTER] 現在のドキュメント ID に該当するドキュメントを削除します。
   * - `logicalDelete` が指定されている場合、削除されたドキュメントは `archive` コレクションに移動されます。
   *
   * @param {object|null} transaction - Firestore transaction object (optional).
   *                                    Firestore トランザクションオブジェクト（省略可能）。
   * @param {function|null} callBack - Function to execute custom logic in subclasses (optional).
   *                                   サブクラスで独自の処理を実行するための関数（省略可能）。
   * @returns {Promise<void>} A Promise that resolves when deletion is complete.
   *                          削除が完了すると解決される Promise。
   * @throws {Error} If an error occurs during document deletion.
   *                 ドキュメントの削除中にエラーが発生した場合にスローされます。
   */
  async delete({ transaction = null, callBack = null } = {}) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.delete.bind(this)({
        transaction,
        callBack,
      });
    } catch (err) {
      adapter.logger.error(`[FireModel.js - delete] ${err.message}`);
      throw err;
    }
  }

  /**
   * [ADAPTER] Restores a deleted document from the archive collection back to its original collection.
   *
   * [ADAPTER] 削除されたドキュメントをアーカイブコレクションから元のコレクションに復元します。
   *
   * @param {string} docId - ID of the document to restore.
   *                         復元するドキュメントの ID。
   * @returns {Promise<DocumentReference>} Reference to the restored document.
   *                                       復元されたドキュメントのリファレンス。
   * @throws {Error} If no document ID is provided, or if the archived document does not exist.
   *                 ドキュメント ID が指定されていない場合や、復元対象のドキュメントが存在しない場合にエラーをスローします。
   */
  static async restore(docId = null) {
    const adapter = FireModel.getAdapter();
    try {
      return await adapter.restore.bind(this)(docId);
    } catch (err) {
      adapter.logger.error(`[FireModel.js - restore] ${err.message}`);
      throw err;
    }
  }

  /**
   * [ADAPTER] Unsubscribes from a Firestore real-time listener.
   * - If an active listener exists, it will be removed.
   *
   * [ADAPTER] Firestore のリアルタイムリスナーを解除します。
   * - 現在のリスナーが存在する場合、そのリスナーを解除します。
   *
   * @returns {void}
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
   * [ADAPTER] Sets a real-time listener on a Firestore document.
   * - If a listener is already active, it will be unsubscribed before setting a new one.
   *
   * [ADAPTER] Firestore のドキュメントに対するリアルタイムリスナーを設定します。
   * - 既にリスナーが設定されている場合、そのリスナーを解除してから新しいリスナーを設定します。
   *
   * @param {string} docId - ID of the document to subscribe to.
   *                         リアルタイムリスナーを設定するドキュメントの ID。
   * @returns {void}
   * @throws {Error} If no document ID is provided.
   *                 ドキュメント ID が指定されていない場合にエラーをスローします。
   */
  subscribe(docId = null) {
    const adapter = FireModel.getAdapter();
    try {
      adapter.subscribe.bind(this)(docId);
    } catch (err) {
      adapter.logger.error(`[FireModel.js - subscribe] ${err.message}`);
      throw err;
    }
  }

  /**
   * [ADAPTER] Sets up a real-time listener on a Firestore collection to monitor document changes.
   * - If `constraints` is a string, N-Gram search using `tokenMap` is performed.
   *   Additional filtering can be specified using `options`.
   * - If `constraints` is an array, Firestore queries are built based on the specified conditions.
   *
   * [ADAPTER] Firestore コレクションに対するリアルタイムリスナーを設定し、ドキュメントの変化を監視します。
   * - 引数 `constraints` が文字列であった場合、`tokenMap` による N-gram 検索が実行されます。
   *   追加の条件は `options` で指定可能です。
   * - 引数 `constraints` が配列であった場合は、配列内の各要素で指定された条件をもとにクエリを実行します。
   *
   * @param {Array|string} constraints - Array of query conditions or a search string.
   *                                     クエリ条件の配列または検索用の文字列。
   * @param {Array} options - Additional query conditions (ignored if `constraints` is an array).
   *                          追加のクエリ条件の配列（`constraints` が配列の場合は無視されます）。
   * @returns {Array<Object>} An array of document data being watched in real-time.
   *                          リアルタイムで監視しているドキュメントのデータが格納された配列。
   * @throws {Error} If an unknown query type is specified.
   *                 不明なクエリタイプが指定された場合にエラーをスローします。
   */
  subscribeDocs(constraints = [], options = []) {
    const adapter = FireModel.getAdapter();
    try {
      return adapter.subscribeDocs.bind(this)(constraints, options);
    } catch (err) {
      adapter.logger.error(`[FireModel.js - subscribeDocs] ${err.message}`);
      throw err;
    }
  }
}
