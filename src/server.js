/**
 * サーバー側のエントリーポイントです。
 * FireModel に ServerAdapter をセットし、各種サービスのインスタンスとともに
 * 提供します。
 */
const { firestore, auth, storage, database } = require("./firebase/server");

const ServerAdapter = require("../src/adapters/ServerAdapter");
const FireModel = require("./FireModel");
FireModel.setAdapter(ServerAdapter);

module.exports = {
  firestore,
  auth,
  storage,
  database,
  FireModel,
};
