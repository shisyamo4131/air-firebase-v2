import { generateTokenMap } from "./utils/tokenMap";

/**
 * @file ./src/BaseClass.js
 * @description FireModel のベースとなるクラスです。
 * - FireModel のサブクラスで実装されるオブジェクト型プロパティを定義するクラスのベースクラスとしても機能します。
 * - クラスで定義するオブジェクト型のプロパティがネストしたオブジェクトを有する場合は BaseClass を継承した
 *   サブクラスをプロパティに設定するべきです。
 * @function
 * - toObject(): インスタンスをプレーンなオブジェクトに変換して返します。
 * - clone(): インスタンスの複製を返します。
 */
export class BaseClass {
  /** tokenMap 生成対象のプロパティ名リスト */
  static tokenFields = [];

  constructor() {
    /** tokenMap */
    // tokenFields が配列であり、要素が含まれている場合のみ
    if (
      Array.isArray(this.constructor.tokenFields) &&
      this.constructor.tokenFields.length
    ) {
      Object.defineProperties(this, {
        tokenMap: {
          enumerable: true,
          configurable: true,
          // get: this._generateTokenMap.bind(this),
          get: () => generateTokenMap(this.constructor.tokenFields, this),
          set: (v) => {
            /** No-op */
          },
        },
      });
    }
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
