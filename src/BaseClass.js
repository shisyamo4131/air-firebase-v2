/**
 * @file ./src/BaseClass.js
 * @description FireModel のベースとなるクラスです。
 * - FireModel のサブクラスで実装されるオブジェクト型プロパティを定義するクラスのベースクラスとしても機能します。
 * - クラスで定義するオブジェクト型のプロパティがネストしたオブジェクトを有する場合は BaseClass を継承した
 *   サブクラスをプロパティに設定するべきです。
 *
 * @getter {Array} schema - classProps に定義されたプロパティ定義情報を配列にして返します。
 *
 * @function toObject - インスタンスをプレーンなオブジェクトに変換して返します。
 * @function clone - インスタンスの複製を返します。
 * @function initialize - インスタンスの各プロパティを与えられたオブジェクトで初期化します。
 *                        引数が与えられなかった場合は各プロパティが classProps.default で初期化されます。
 * @function beforeInitialize - initialize() の最初に実行されるフックです。
 * @function afterInitialize - initialize() の最後に実行されるフックです。
 *
 * NOTE: `_outputErrorConsole` メソッドは ClientAdapter のみで使用されているが、ここに実装する必要なしと判断。
 *       将来的に ClientAdapter 側で独自実装することを検討。
 */
import { generateTokenMap } from "./utils/tokenMap.js";

export class BaseClass {
  /**
   * クラス名
   */
  static className = "BaseClass";

  /**
   * プロパティ定義マップ
   *
   * 継承先のクラスでプロパティの初期化や検証に利用する設定をまとめる場所です。
   *
   * 各キーの設定項目:
   * - type       : String｜Number｜Boolean｜Array｜Object のいずれか（※Dateは指定不可）
   * - default    : 初期値または初期化関数
   * - required   : 必須フラグ（boolean、省略時は false 扱い）
   * - customClass: BaseClass を継承したサブクラスを指定（省略可）
   * - validator  : 値検証用の関数（省略可）
   *
   * 例:
   * static classProps = {
   *   name: { type: String, default: '', required: true },
   *   items: { type: Array, default: () => [], customClass: ItemClass }
   * };
   */
  static classProps = {};

  /**
   * インスタンスを一覧表示（テーブル表示）する際に使用するヘッダー定義です。
   * Vuetify の v-data-table コンポーネントで使用される形式に準拠しています。
   */
  static headers = null;

  /**
   * classProps に定義されたプロパティ定義情報を配列にして返します。
   */
  static get schema() {
    return Object.entries(this.classProps).map(([key, value]) => {
      return { key, ...value };
    });
  }

  /** tokenMap 生成対象のプロパティ名リスト */
  static tokenFields = [];

  constructor(data = {}) {
    this.initialize(data);
    this._defineTokenMap();
  }

  /**
   * tokenFields の定義に従って tokenMap プロパティを用意します。
   */
  _defineTokenMap() {
    const tokenFields = this.constructor.tokenFields;
    if (!Array.isArray(tokenFields) || !tokenFields.length) return;
    Object.defineProperty(this, "tokenMap", {
      enumerable: true,
      configurable: true,

      // 2025-12-30 - 修正: アロー関数ではなく通常の関数として定義し、this バインディングを正しく設定
      // get: () => generateTokenMap(this.constructor.tokenFields, this),
      get() {
        return generateTokenMap(this.constructor.tokenFields, this);
      },

      // 2025-12-30 - 修正: No-op の set をアロー関数から通常の関数に変更
      // set: (v) => {
      //   /** No-op */
      // },
      set() {},
    });
  }

  /**
   * `initialize` メソッドで呼び出され、`classProps` に定義されたプロパティをインスタンスに実装し、`default` 値で初期化します。
   * - `classProps` に定義されていてインスタンスに実装されていないプロパティが存在すれば、ここで実装されます。
   *
   * NOTE: このメソッドでは `classProps` に定義された既存プロパティを一度削除してから再作成します。
   *
   * 理由: 継承先クラスで、何らかの副作用を持つ計算プロパティ（getter/setter）が同名で実装された場合、
   *       その副作用はインスタンス初期化後に発生するべきだからです。
   *
   * 例: 売上日が変更されると締日が自動更新される計算プロパティの場合
   *     1. 初期化時: データから渡された締日をそのまま設定（自動計算は発動させたくない）
   *     2. 初期化後: 売上日を変更すると締日が自動更新される
   *     3. ユーザーが締日を手動で変更することも可能
   *     ※ プロパティを削除せずに初期化すると、手動設定した締日が意図せず上書きされる
   */
  _setDefault() {
    const classProps = this.constructor.classProps || {};
    Object.keys(classProps).forEach((key) => {
      const propConfig = classProps[key];
      const defaultValue = propConfig.default;

      // 既存のプロパティ定義を削除
      delete this[key];

      // デフォルト値で再設定
      this[key] =
        typeof defaultValue === "function" ? defaultValue() : defaultValue;
    });
  }

  /**
   * `classProps` に定義されたプロパティをクラスに実装後、`data` で与えられたオブジェクトで
   * 初期化する直前に呼び出されるフックメソッドです。
   * - デフォルト実装は何もしません。サブクラスでオーバーライドして利用します。
   * - 初期化処理が完了する前に何らかの処理を強制するためのものであるため
   *   余程特殊な処理でない限り、ここでプロパティの初期化を行うべきではありません。
   * @param {Object} data
   */
  beforeInitialize(data) {}

  /**
   * `classProps` に定義されたプロパティがクラスに実装され、`data` で与えられたオブジェクトで
   * 初期化された直後に呼び出されるフックメソッドです。
   * - デフォルト実装は何もしません。サブクラスでオーバーライドして利用します。
   * - 初期化処理が完了した後に何らかの処理を強制するためのもので、クラス特有の計算プロパティなどを
   *   設定する際に使用します。
   * @param {Object} data
   */
  afterInitialize(data) {}

  /**
   * インスタンスの各プロパティを `data` で与えられたオブジェクトで初期化します。
   * - `_setDefault()` が呼び出され、`data` が与えられなかった場合は `classProps` に定義された
   *   `default` 値で初期化されます。
   * - `beforeInitialize` と `afterInitialize` フックメソッドが呼び出されます。
   * - 初期化直後の状態が `_beforeData` プロパティとして保存されます。
   * @param {Object} data
   */
  initialize(data = {}) {
    // プロパティを初期化
    // - 既存プロパティは一度削除されて再作成される。
    // - data が与えられなかった場合は default 値で初期化される。
    this._setDefault();

    // 初期化前のフックを呼び出す
    this.beforeInitialize(data);

    // data の内容でプロパティを上書きする関数
    const copyValue = (value, customClass) => {
      if (value == null) return value;
      if (Array.isArray(value)) {
        return value.map((v) => copyValue(v, customClass));
      }
      if (customClass) return new customClass(value);
      if (typeof value.toDate === "function") {
        return value.toDate();
      }
      if (value instanceof Date) return new Date(value);
      if (typeof value === "object") return { ...value };
      return value;
    };

    // data の内容でプロパティを上書き
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        const classProps = this.constructor.classProps?.[key];
        if (classProps) {
          const customClass = classProps?.customClass;
          this[key] = copyValue(value, customClass);
        }
      });
    }

    // 初期化後のフックを呼び出す
    this.afterInitialize(data);

    // 初期化直後の状態を `_beforeData` プロパティとして保存
    this._beforeData = this.toObject();
  }

  /**
   * Outputs an error message to the console.
   * - Use this method only for unexpected errors.
   *
   * NOTE: ClientAdapter でのみ使用されている。要改修。
   * @param {string} funcName
   * @param {Error} err - The error object to log.
   */
  _outputErrorConsole(funcName, err) {
    console.error(
      `[ClientAdapter.js - ${funcName}] Unknown error has occurred:`,
      err
    );
  }

  /**
   * 任意の値をクローンします。
   * - null または undefined はそのまま返却します。
   * - 独自クラスのインスタンスは toObject() を呼び出して複製します。
   * - Date オブジェクトは新規インスタンスを生成して複製します。
   * - 配列は各要素を再帰的にクローンして複製します。
   * - その他のオブジェクトはシャローコピーを行います。
   * - プリミティブ値（文字列・数値・真偽値など）はそのまま返却します。
   *
   * @param {*} value クローン対象の値
   * @returns {*} クローンされた値
   */
  static _cloneValue(value) {
    // null や undefined はそのまま返す
    if (value == null) return value;

    // カスタムクラスのインスタンスなら toObject() を呼ぶ
    if (typeof value.toObject === "function") {
      return value.toObject();
    }

    // Date はクローンを作成
    if (value instanceof Date) {
      return new Date(value.getTime());
    }

    // 配列は要素ごとに再帰クローン
    if (Array.isArray(value)) {
      return value.map((v) => this._cloneValue(v));
    }

    // それ以外のオブジェクトはシャローコピー
    if (typeof value === "object") {
      return { ...value };
    }

    // プリミティブ型はそのまま返す
    return value;
  }

  /**
   * インスタンスをプレーンなオブジェクトに変換します。
   * - 列挙可能 (enumerable = true) なプロパティのみが変換の対象です。
   *
   * @returns {object} - プレーンなオブジェクトに変換されたインスタンス
   */
  toObject() {
    const result = Object.keys(this).reduce((obj, key) => {
      obj[key] = this.constructor._cloneValue(this[key]);
      return obj;
    }, {});

    delete result._beforeData;
    return result;
  }

  /**
   * インスタンスのクローンを生成します。
   * - 参照を避けたい場合（Vue コンポーネントでの親子間受け渡しなど）に有効です。
   * - Deep clone ではなく、同一クラスの新しいインスタンスとして返されます。
   *
   * @returns {this} クローンされた新しいインスタンス
   */
  clone() {
    return new this.constructor(this.toObject());
  }

  /**
   * インスタンスの状態を `_beforeData` の内容で復元します。
   */
  undo() {
    this.initialize(this._beforeData);
  }

  /**
   * `classProps` に基づいてプロパティの値を検証します。
   * - `required` フィールドの存在確認を行います。
   * - 型の整合性、カスタムバリデータの実行も行われます。
   *
   * @throws {Error} 必須フィールドの欠落やバリデーション失敗時にスローされます
   *
   * @update 2025-12-29 - length validation を追加し、全体的にリファクタリング。
   */
  // validate() {
  //   Object.entries(this.constructor.classProps).forEach(([key, config]) => {
  //     const { type, required, validator } = config;

  //     switch (type) {
  //       case String:
  //       case Number:
  //       case Object: {
  //         const isValueMissing =
  //           this[key] === undefined || this[key] === null || this[key] === "";
  //         if (required && isValueMissing) {
  //           throw new Error(`${key} is required.`);
  //         }
  //         break;
  //       }

  //       case Array: {
  //         if (
  //           required &&
  //           (!Array.isArray(this[key]) || this[key].length === 0)
  //         ) {
  //           throw new Error(`${key} requires one or more elements.`);
  //         }
  //         break;
  //       }

  //       case Boolean:
  //         // Typically nothing to validate here unless a custom validator is provided.
  //         break;

  //       default:
  //         throw new Error(
  //           `Unknown type is defined at classProps. type: ${config.type}`
  //         );
  //     }

  //     // Custom validator check
  //     if (validator && !validator(this[key])) {
  //       throw new Error(`Invalid value at ${key}. value: ${this[key]}`);
  //     }
  //   });
  // }
  validate() {
    Object.entries(this.constructor.classProps).forEach(([key, config]) => {
      const { type, required, validator, length, label } = config;
      const value = this[key];
      const fieldLabel = label || key;

      // Required validation
      if (required) {
        if (type === String || type === Number || type === Object) {
          if (value == null || value === "") {
            throw new Error(`${fieldLabel} is required.`);
          }
        }
        if (type === Array) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error(`${fieldLabel} must have at least one item.`);
          }
        }
      }

      // Length validation
      if (length != null && value != null) {
        if (type === String && typeof value === "string") {
          if (value.length > length) {
            throw new Error(
              `${fieldLabel} must be ${length} characters or less.`
            );
          }
        }
        if (type === Array && Array.isArray(value)) {
          if (value.length > length) {
            throw new Error(`${fieldLabel} must have ${length} items or less.`);
          }
        }
      }

      // Custom validator
      if (validator && typeof validator === "function") {
        const result = validator(value);
        if (result !== true) {
          // validator が文字列を返す場合はそれをエラーメッセージとして使用
          const message =
            typeof result === "string"
              ? result
              : `Invalid value for ${fieldLabel}.`;
          throw new Error(message);
        }
      }
    });
  }
}
