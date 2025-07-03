import { generateTokenMap } from "./utils/tokenMap.js";

/**
 * @file ./src/BaseClass.js
 * @description FireModel のベースとなるクラスです。
 * - FireModel のサブクラスで実装されるオブジェクト型プロパティを定義するクラスのベースクラスとしても機能します。
 * - クラスで定義するオブジェクト型のプロパティがネストしたオブジェクトを有する場合は BaseClass を継承した
 *   サブクラスをプロパティに設定するべきです。
 * @function
 * - toObject(): インスタンスをプレーンなオブジェクトに変換して返します。
 * - clone(): インスタンスの複製を返します。
 * - initialize(): インスタンスの各プロパティを与えられたオブジェクトで初期化します。
 *                 引数が与えられなかった場合は各プロパティが classProps.default で初期化されます。
 * - beforeInitialize(): initialize() の最初に実行されるフックです。
 * - afterInitialize(): initialize() の最後に実行されるフックです。
 */
export class BaseClass {
  /**
   * クラス名
   */
  static name = "BaseClass";

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
      get: () => generateTokenMap(this.constructor.tokenFields, this),
      set: (v) => {
        /** No-op */
      },
    });
  }

  beforeInitialize(data) {}
  afterInitialize(data) {}

  initialize(data = {}) {
    this.beforeInitialize(data);
    this._setDefault();
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
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        const classProps = this.constructor.classProps?.[key];
        const customClass = classProps?.customClass;
        this[key] = copyValue(value, customClass);
      });
    }
    this.afterInitialize(data);
  }

  /**
   * インスタンスの各プロパティの値を classProps の default で定義されている値に更新します。
   * - classProps に定義されていてインスタンスに実装されていないプロパティが存在すれば、ここで実装されます。
   */
  _setDefault() {
    const classProps = this.constructor.classProps || {};
    Object.keys(classProps).forEach((key) => {
      const propConfig = classProps[key];
      const defaultValue = propConfig.default;
      this[key] =
        typeof defaultValue === "function" ? defaultValue() : defaultValue;
    });
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
    return Object.keys(this).reduce((obj, key) => {
      obj[key] = this.constructor._cloneValue(this[key]);
      return obj;
    }, {});
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
}
