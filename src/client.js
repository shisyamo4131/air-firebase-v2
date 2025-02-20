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
} = require("./firebase/client");

const ClientAdapter = require("../src/adapters/ClientAdapter");
const FireModel = require("./FireModel");
FireModel.setAdapter(ClientAdapter);

module.exports = {
  firestore,
  auth,
  storage,
  database,
  functions,
  FireModel,
};
