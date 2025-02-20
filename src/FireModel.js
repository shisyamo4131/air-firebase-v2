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

  // constructor(collectionPath) {
  //   this.collectionPath = collectionPath;
  // }

  /**
   * set Client or Server's adapter to FireModel.
   * @param {ClientAdapter} adapter
   */
  static setAdapter(adapter) {
    FireModel.adapter = adapter;
  }

  /**
   * get Client or Server's adapter from FireModel.
   */
  static getAdapter() {
    if (!FireModel.adapter) {
      throw new Error(
        "Firestore adapter is not set. Call FireModel.setAdapter first."
      );
    }
    return FireModel.adapter;
  }

  async create(data) {
    return await FireModel.getAdapter().create(
      this.constructor.collectionPath,
      data
    );
  }

  async get(id) {
    return await FireModel.getAdapter().get(
      this.constructor.collectionPath,
      id
    );
  }

  async update(id, data) {
    return await FireModel.getAdapter().update(
      this.constructor.collectionPath,
      id,
      data
    );
  }

  async delete(id) {
    return await FireModel.getAdapter().delete(
      this.constructor.collectionPath,
      id
    );
  }
}

module.exports = FireModel;
