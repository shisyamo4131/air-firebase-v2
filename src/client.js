/**
 * アプリ側のエントリーポイントです。
 * FireModel に ClientAdapter をセットし、各種サービスのインスタンスとともに
 * 提供します。
 */
const {
  firestore,
  auth,
  storage,
  database,
  functions,
} = require("./firebase/client.js");
const { ClientAdapter } = require("./adapters/ClientAdapter.js");
const { FireModel } = require("./FireModel.js");

FireModel.setAdapter(new ClientAdapter());

module.exports = { firestore, auth, storage, database, functions, FireModel };
