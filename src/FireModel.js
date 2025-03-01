/**
 * Firestore ドキュメントの CRUD 機能を提供するベースクラスです。
 * 管理するコレクションごとにこのクラスを継承して使用します。
 * Firestore ドキュメントの CRUD についてはサーバー側、アプリ側で仕組みが異なるため、
 * これを吸収するために実際の処理はアダプターで実装しています。
 */
class FireModel {
  /**
   * アダプター
   * adapters.ClientAdapter または ServerAdapter を受け取ります。
   */
  static adapter = null;

  /**
   * コレクション（パス）
   * 管理するコレクションの名前（パス）です。
   */
  static collectionPath = "FireModel";

  /**
   * 自動採番を行うかどうかのフラグです。
   */
  static useAutonumber = false;

  /**
   * 論理削除を適用するかどうかのフラグです。
   */
  static logicalDelete = false;

  /**
   * クラスに適用するプロパティの定義です。
   * { type, default, required[option], customClass[option], validator[option] }
   * type: プロパティの型です。
   * default: プロパティの初期値です。
   * required: ドキュメントを作成または更新する際、値を必須とするためのフラグです。（オプション）
   * customClass: type が Object の場合、オブジェクトが指定されたクラスのインスタンスに変換されます。
   *              type が Array の場合、配列内の要素（オブジェクト）が指定されたクラスのインスタンスに変換されます。
   *              その他の type の場合は無視されます。
   * validator: プロパティに適用されるバリデータです。
   */
  static classProps = {};

  /**
   * 当該クラスが管理するコレクションドキュメントに依存するコレクションの定義です。
   * { collectionPath, field, condition, type }
   */
  static hasMany = [];

  /**
   * tokenMap に反映させるフィールドのリストです。
   * Firestore の脆弱なクエリを補う為、NGram 検索のための tokenMap を生成します。
   * 指定されたフィールドにセットされている値の 1文字 または 2文字 をキーとした
   * オブジェクトが生成されます。
   */
  static tokenFields = [];

  /**
   * リアルタイムリスナーによるドキュメントの購読を開始した際の
   * リスナー用変数です。
   */
  #listener = null;
  get listener() {
    return this.#listener;
  }
  set listener(v) {
    this.#listener = v;
  }

  /**
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
   * FireModel にアダプターをセットします。
   * @param {ClientAdapter | ServerAdapter} adapter
   */
  static setAdapter(adapter) {
    FireModel.adapter = adapter;
  }

  /**
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
   * コンストラクタ
   * @param {Object} item - オブジェクトをもとに対応するプロパティが初期化されます。
   */
  constructor(item = {}) {
    // classProps に定義された内容でプロパティを用意
    this.#createProperties();

    // 初期化処理を実行
    this.initialize(item);
  }

  /**
   * 当該インスタンスを複製したインスタンスを返します。
   * - vueコンポーネントにおいてインスタンスを親に返す場合など、参照渡しを回避するのに使用します。
   * @returns {this.constructor} - 複製された新しいインスタンス
   */
  clone() {
    return new this.constructor(this);
  }

  /**
   * 当該インスタンスをプレーンなオブジェクトにして返します。
   * @returns {Object} - 当該インスタンスのプレーンなオブジェクト
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
        if (typeof value?.toObect === "function") {
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
            else if (typeof element === "object") {
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
   * Firestore から取得したデータ（スナップショット）を当該クラスのインスタンスに変換して返します。
   * @param {Object} snapshot - Firestoreから取得したドキュメントスナップショット
   * @returns {Object} - スナップショットデータを当該クラスのインスタンスに変換したオブジェクト
   */
  fromFirestore(snapshot) {
    const data = snapshot?.data ? snapshot.data() : null;

    if (!data) {
      throw new Error(
        `[FireModel.js] Argument 'snapshot' is not Firestore's snapshot.`
      );
    }

    // 配列またはオブジェクトであるデータで、カスタムクラスの定義があれば
    // カスタムクラスインスタンスに変換
    Object.keys(data).forEach((key) => {
      // classProps の定義を取得
      const classProp = this.constructor.classProps?.[key];

      if (classProp?.type === Array && classProp?.customClass) {
        data[key] = data[key].map((element) => {
          return new classProp.customClass(element);
        });
      } else if (classProp?.type === Object && classProp?.customClass) {
        data[key] = new classProp.customClass(data[key]);
      }
    });

    return new this.constructor(data);
  }

  /**
   * Firestore 用のコンバーターを提供します。
   */
  converter() {
    return {
      toFirestore: (instance) => instance.toObject(),
      fromFirestore: (snapshot) => this.fromFirestore(snapshot),
    };
  }

  /**
   * クラスインスタンスの各プロパティを初期化します。
   * - classProps に定義された内容でクラスインスタンスにプロパティが用意されます。
   * - コンストラクタから呼び出される他、個別に呼び出すことで引数に与えられたオブジェクトをもとに
   *   各プロパティが初期化されます。
   * @param {Object} item - 初期化時に各種プロパティにセットされる値を有したオブジェクト
   */
  initialize(item = {}) {
    // 初期化処理
    const { docId, uid, createdAt, updatedAt, ...data } = item || {};

    // docId, uid の初期化処理
    this.docId = item?.docId || "";
    this.uid = item?.uid || "";

    // createdAt, updatedAt は 日付型であればそのまま、toDate を持っていれば日付型に変換
    if (createdAt instanceof Date) {
      this.createdAt = createdAt;
    } else if (createdAt?.toDate) {
      this.createdAt = createdAt.toDate();
    } else {
      this.createdAt = null;
    }

    if (updatedAt instanceof Date) {
      this.updatedAt = updatedAt;
    } else if (updatedAt?.toDate) {
      this.updatedAt = updatedAt.toDate();
    } else {
      this.updatedAt = null;
    }

    // createdAt, updatedAt 以外の処理
    if (data) {
      Object.keys(data).forEach((key) => {
        // classProps の定義を取得
        const classProp = this.constructor.classProps?.[key];

        // classProps に定義されていない key のみを処理
        if (classProp) {
          switch (classProp.type) {
            // type が String, Number, Boolean の場合はそのまま自身のプロパティにセット
            case String:
            case Number:
            case Boolean:
              this[key] = data[key];
              break;

            /**
             * type が　Object の場合はカスタムクラス設定の有無に応じて処理
             * - カスタムクラスが定義されていれば指定されたインスタンスに変換
             * - toDate を持つようであれば日付型に変換
             *   -> Firestore から timestamp 型の値を取得すると toDate を持つ
             * - それ以外であればディープコピー
             */
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

            /**
             * type は Array の場合はカスタムクラス設定の有無に応じて処理
             * - カスタムクラスが定義されていればすべての要素をインスタンスに変換
             * - カスタムクラスが定義されていなければディープコピー
             */
            case Array: {
              const customClass = classProp?.customClass;
              this[key] = data[key].map((element) => {
                return customClass ? new customClass(element) : element;
              });
              if (customClass) {
                this[key] = data[key].map(
                  (element) => new customClass(element)
                );
              } else {
                this[key] = JSON.parse(JSON.stringify(data[key]));
              }
              break;
            }

            // それ以外の型であればエラー
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
   * classProps に定義された内容でプロパティを生成します。
   * docId, uid, createdAt, updatedAt は強制的に生成されます。
   * tokenFields に要素が指定されている場合は tokenMap プロパティも生成します。
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
      if (typeof defaultValue === "function") {
        this[key] = defaultValue();
      } else {
        this[key] = defaultValue;
      }
    });

    // tokenFields が要素を持っていれば、tokenMap プロパティを用意
    if (this.constructor.tokenFields.length) {
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
   * classProps に定義された内容で各プロパティの値の妥当性を検査します。
   * Firestore ドキュメントの作成または更新前に呼び出されます。
   * @throws {Error} - 妥当性の検査に不合格であった場合
   */
  validate() {
    Object.entries(this.constructor.classProps).forEach(([key, config]) => {
      const { type, required, validator } = config;
      switch (type) {
        case String:
        case Number:
        case Object:
          const isValueMissing =
            this[key] === undefined || this[key] === null || this[key] === "";
          if (required && isValueMissing) {
            throw new Error(`${key} is required.`);
          }
          break;
        case Array:
          if (this[key].length === 0) {
            throw new Error(`${key} requires one or more elements.`);
          }
        case Boolean:
          break;

        // それ以外の型であればエラー
        default: {
          throw new Error(
            `Unknown type is defined at classProps. type: ${config.type}`
          );
        }
      }

      // バリデーションチェック
      if (validator && !validator(this[key])) {
        throw new Error(`Invalid value at ${key}. value: ${this[key]}`);
      }
    });
  }

  /**
   * tokenMapを生成して返します。
   * - tokenFields で指定されたフィールドの値からトークンを生成し、トークンマップを作成します。
   * - フィールドが存在しないか、値が空の場合は無視されます。
   * - サロゲートペア、特殊文字、および空白文字を除去してトークンを生成します。
   *
   * @returns {Object|null} 生成されたtokenMapを返します。対象フィールドがない場合はnullを返します。
   */
  #generateTokenMap() {
    if (!this.constructor.tokenFields.length) return null;
    const arr = [];
    this.constructor.tokenFields.forEach((fieldName) => {
      if (fieldName in this && this[fieldName]) {
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
    return Object.fromEntries(arr);
  }

  /**
   * tokenMapのセッターです。
   * - 初期化時のエラーを避けるためのNo-op（何もしない）セッターです。
   * - 必要に応じて、特定のロジックを実装するためにカスタマイズできます。
   *
   * @param {Object} value - セットするtokenMapの値
   */
  #setTokenMap(value) {
    // No-op setter to avoid errors during initialization.
    // This can be customized if needed to handle specific logic.
  }

  /**
   * ドキュメント作成前の処理です。
   * - 継承先でオーバーライドして使用されることを前提としており、当該クラスでは
   *   何も処理しません。
   * @returns {Promise<void>} - デフォルトでは解決済みのプロミスを返します。
   */
  beforeCreate() {
    return Promise.resolve();
  }

  /**
   * ドキュメント更新前の処理です。
   * - 継承先でオーバーライドして使用されることを前提としており、当該クラスでは
   *   何も処理しません。
   * @returns {Promise<void>} - デフォルトでは解決済みのプロミスを返します。
   */
  beforeUpdate() {
    return Promise.resolve();
  }

  /**
   * ドキュメント削除前の処理です。
   * - 継承先でオーバーライドして使用されることを前提としており、当該クラスでは
   *   何も処理しません。
   * @returns {Promise<void>} - デフォルトでは解決済みのプロミスを返します。
   */
  beforeDelete() {
    return Promise.resolve();
  }

  /**
   * [ADAPTER]
   * Firestore のトランザクションを使用して、インスタンスに採番を行います。
   * - `Autonumbers` コレクションから、現在の自動採番ドキュメントを取得します。
   * - 採番可能である場合、現在値をインクリメントし、新しい採番コードをインスタンスにセットします。
   * - `current` 値を更新するための関数を返します。（更新処理は呼び出し元で実行）
   *
   * @param {Object} transaction - Firestore のトランザクションオブジェクト（必須）
   * @returns {Promise<Function>} - Firestore の `current` 値を更新するための関数
   * @throws {Error} - `Autonumbers` コレクションに対象コレクションのドキュメントが存在しない場合
   * @throws {Error} - 採番が無効化されている (`status: false`) 場合
   * @throws {Error} - 採番の最大値 (`10^length - 1`) に達した場合
   */
  async setAutonumber(transaction) {
    const adapter = FireModel.getAdapter();
    return await adapter.setAutonumber.bind(this)(transaction);
  }

  /**
   * [ADAPTER]
   * Firestore にドキュメントを作成します。
   * - ドキュメントの作成は必ずトランザクション処理で実行されます。
   *   引数 transaction が与えられなかった場合、この関数内でトランザクションが生成されます。
   * - `docId` を指定しない場合、Firestore により自動で ID が割り当てられます。
   * - `useAutonumber` を `true` にすると、自動採番 (`setAutonumber()`) を実行します。
   *   但し、自動採番を行うためにはクラスの useAutonumber が true である必要があります。
   * - `callBack` が指定されている場合、ドキュメント作成後にコールバック関数を実行します。
   *
   * @param {Object} args - ドキュメント作成のためのパラメータ
   * @param {string|null} [args.docId] - 作成するドキュメントのID（オプション）
   * @param {boolean} [args.useAutonumber=true] - `true` の場合、自動採番を実行します。
   * @param {Object|null} [args.transaction] - Firestore のトランザクションオブジェクト
   * @param {function|null} [args.callBack] - ドキュメント作成後に実行するコールバック関数です。
   * @returns {Promise<DocumentReference>} - 作成されたドキュメントの参照を返します。
   * @throws {Error} - `callBack` が関数でない場合はエラーをスローします。
   * @throws {Error} - Firestore への書き込みに失敗した場合はエラーをスローします。
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
   * [ADAPTER]
   * 指定された ID に該当するドキュメントを Firestore から取得し、インスタンスに読み込みます。
   * - ドキュメントが存在しない場合、インスタンスのデータをリセット (`initialize(null)`) します。
   * - `transaction` が指定されている場合、トランザクションを使用して取得します。
   * - `transaction` が `null` の場合、通常の `getDoc()` を使用して取得します。
   *
   * @param {string} docId - 取得するドキュメントのIDです。
   * @param {Object|null} [transaction=null] - Firestore のトランザクションオブジェクトです。（オプション）
   * @returns {Promise<boolean>} - ドキュメントが存在した場合は `true`、存在しない場合は `false` を返します。
   * @throws {Error} - `docId` が指定されていない場合、または Firestore の取得処理に失敗した場合
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
   * [ADAPTER]
   * Firestore から指定された ID に該当するドキュメントを取得し、新しいオブジェクトとして返します。
   * - `fetch()` はこのクラスのインスタンスにデータをセットしますが、`fetchDoc()` は新しいオブジェクトとして返します。
   * - `transaction` が指定されている場合、トランザクションを使用して取得します。
   * - `transaction` が `null` の場合、通常の `getDoc()` を使用して取得します。
   *
   * @param {string} docId - 取得するドキュメントのIDです。
   * @param {Object|null} [transaction=null] - Firestore のトランザクションオブジェクトです。（オプション）
   * @returns {Promise<Object|null>} - 取得したデータオブジェクトを返します。ドキュメントが存在しない場合は `null` を返します。
   * @throws {Error} - `docId` が指定されていない場合、または Firestore の取得処理に失敗した場合
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
   * [ADAPTER]
   * Firestore のクエリ条件の配列を受け取り、Firestore のクエリオブジェクト配列を生成して返します。
   * - `constraints` 配列には、`where`, `orderBy`, `limit` などの Firestore クエリを指定できます。
   * - 例：`[['where', 'age', '>=', 18], ['orderBy', 'age', 'desc'], ['limit', 10]]`
   * - 不明なクエリタイプが指定された場合はエラーをスローします。
   *
   * @param {Array} constraints - クエリ条件の配列です。
   * @returns {Array<Object>} - Firestore クエリオブジェクトの配列を返します。
   * @throws {Error} - 不明なクエリタイプが指定された場合、エラーをスローします。
   */
  createQueries(constraints) {
    const adapter = FireModel.getAdapter();
    return adapter.createQueries.bind(this)(constraints);
  }

  /**
   * [ADAPTER]
   * Firestore の `tokenMap` に基づく N-Gram 検索用のクエリオブジェクトを生成します。
   * - 検索文字列の 1 文字・2 文字ごとのトークンを作成し、Firestore の `tokenMap` を利用した検索クエリを生成します。
   * - 例：`"検索"` → `['検', '索', '検索']`
   * - サロゲートペア文字（絵文字など）は Firestore の `tokenMap` では検索対象としないため除外します。
   *
   * @param {string} constraints - 検索に使用する文字列です。
   * @returns {Array<Object>} - Firestore クエリオブジェクトの配列を返します。
   * @throws {Error} - `constraints` が空文字の場合、エラーをスローします。
   */
  createTokenMapQueries(constraints) {
    const adapter = FireModel.getAdapter();
    return adapter.createTokenMapQueries.bind(this)(constraints);
  }

  /**
   * [ADAPTER]
   * Firestore から条件に一致するドキュメントを取得します。
   * - 引数 constraints が文字列であった場合、tokenMap による N-gram 検索が実行されます。
   *   options で追加の条件を指定可能です。
   * - 引数 constraints が配列であった場合は配列内の各要素で指定された条件をもとにクエリを実行します。
   *
   * @param {Array|string} constraints - クエリ条件の配列または検索用の文字列
   * @param {Array} options - 追加のクエリ条件の配列（constraints が配列の場合は無視されます。）
   * @returns {Promise<Array<Object>>} - 取得したドキュメントで初期化された当該インスタンスの配列
   * @throws {Error} 不明なクエリタイプが指定された場合
   * @throws {Error} ドキュメントの取得に失敗した場合
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
   * [ADAPTER]
   * Firestore ドキュメントを現在のプロパティ値で更新します。
   * @param {function|null} transaction - トランザクション処理を行うための関数（省略可能、デフォルトは `null`）
   * @param {function|null} callBack - サブクラス側で独自の処理を実行するための関数（省略可能、デフォルトは `null`）
   * @returns {Promise<DocumentReference>} - 更新された Firestore ドキュメントの参照を返します。
   * @throws {Error} - ドキュメント更新中にエラーが発生した場合にスローされます。
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
   * [ADAPTER]
   * `hasMany` プロパティにセットされた条件に基づき、現在のドキュメントに依存している子ドキュメントが
   * 存在しているかどうかを確認します。
   * @param {function|null} transaction - トランザクション処理を行うための関数（省略可能、デフォルトは `null`）
   * @returns {Promise<object|boolean>} - 子ドキュメントが存在する場合は `hasMany` の該当項目を返し、
   *                                      存在しない場合は `false` を返します。
   * @throws {Error} - Firestore の操作中にエラーが発生した場合にスローされます。
   */
  async hasChild(transaction = null) {
    const adapter = FireModel.getAdapter();
    return adapter.hasChild.bind(this)(transaction);
  }

  /**
   * [ADAPTER]
   * 現在のドキュメント ID に該当するドキュメントを削除します。
   * - logicalDelete が指定されている場合、削除されたドキュメントは archive コレクションに移動されます。
   * @param {object|null} transaction - Firestoreトランザクションオブジェクト（省略可能）
   * @param {function|null} callBack - サブクラス側で独自の処理を実行するための関数（省略可能）
   * @returns {Promise<void>} - 削除が完了すると解決されるPromise
   * @throws {Error} - ドキュメントの削除中にエラーが発生した場合にスローされます
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
   * [ADAPTER]
   * 削除されたドキュメントをアーカイブコレクションから元のコレクションに復元します。
   * @param {string} docId - 復元するドキュメントのID
   * @returns {Promise<DocumentReference>} - 復元されたドキュメントのリファレンス
   * @throws {Error} - ドキュメントIDが指定されていない場合や、復元するドキュメントが存在しない場合にエラーをスローします
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
   * [ADAPTER]
   * Firestoreのリアルタイムリスナーを解除します。
   * 現在のリスナーが存在する場合、そのリスナーを解除します。
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
   * [ADAPTER]
   * Firestoreのドキュメントに対するリアルタイムリスナーを設定します。
   * 既にリスナーが設定されている場合、そのリスナーを解除してから新しいリスナーを設定します。
   * @param {string} docId - リアルタイムリスナーを設定するドキュメントのID
   * @returns {void}
   * @throws {Error} - ドキュメントIDが指定されていない場合にエラーをスローします
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
   * [ADAPTER]
   * Firestoreコレクションに対するリアルタイムリスナーを設定し、ドキュメントの変化を監視します。
   * - 引数 constraints が文字列であった場合、tokenMap による N-gram 検索が実行されます。
   *   追加の条件は options で指定可能です。
   * - 引数 constraints が配列であった場合は配列内の各要素で指定された条件をもとにクエリを実行します。
   *
   * @param {Array|string} constraints - クエリ条件の配列（新形式）または検索用の文字列
   * @param {Array} options - 追加のクエリ条件の配列（constraints が配列の場合は無視されます。）
   * @returns {Array<Object>} - リアルタイムで監視しているドキュメントのデータが格納された配列
   * @throws {Error} 不明なクエリタイプが指定された場合
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

export default FireModel;
