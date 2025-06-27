/**
 * @file ./src/BaseClass.js
 * @description FireModel のベースとなるクラスです。
 * - FireModel のサブクラスで実装されるオブジェクト型プロパティを定義するクラスのベースクラスとしても機能します。
 * - toObject(): インスタンスをプレーンなオブジェクトに変換する機能を提供します。
 */
export class BaseClass {
  /**
   * インスタンスをプレーンなオブジェクトに変換します。
   * - 列挙可能 (enumerable = true) なプロパティのみが変換の対象です。
   * - プロパティの値が toObject() を有している場合はこれを実行します。（再帰呼び出し）
   * - Date オブジェクトはクローンを作成して参照が切り離されます。
   * - その他の配列を除くオブジェクトはシャローコピーされます。
   * - 配列は各要素ごとに上記の条件で処理されます。
   *
   * NOTE:
   * 原則として参照を切り離した状態のオブジェクトを返しますが、
   * プロパティがネストされたオブジェクトで、かつ toObject() を有さない、
   * または Date オブジェクトである場合に、これらはシャローコピーされるため
   * 参照が切り離されません。
   * プロパティにオブジェクトを定義する場合は toObject() を有するクラスとするべきです。
   * @returns {object} - プレーンなオブジェクトに変換されたインスタンス
   */
  toObject() {
    const obj = {};

    // this の列挙可能なプロパティを処理
    for (const key of Object.keys(this)) {
      const value = this[key];

      // カスタム toObject メソッドがあれば再帰呼び出し
      if (value && typeof value.toObject === "function") {
        obj[key] = value.toObject();
      }
      // Date オブジェクトはクローンを作成して参照を切り離し
      else if (value instanceof Date) {
        obj[key] = new Date(value.getTime());
      }
      // 配列要素は各要素ごとに処理
      else if (Array.isArray(value)) {
        obj[key] = value.map((element) => {
          if (element && typeof element.toObject === "function") {
            return element.toObject();
          }
          if (element instanceof Date) {
            return new Date(element.getTime());
          }
          if (typeof element === "object" && element !== null) {
            return { ...element };
          }
          return element;
        });
      }
      // その他のオブジェクトは浅いコピーで参照を切り離し
      else if (typeof value === "object" && value !== null) {
        obj[key] = { ...value };
      }
      // プリミティブ型はそのままセット
      else {
        obj[key] = value;
      }
    }

    return obj;
  }
}
