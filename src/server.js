/**
 * サーバー側のエントリーポイントです。
 * FireModel に ServerAdapter をセットし、各種サービスのインスタンスとともに
 * 提供します。
 */
const { firestore, auth, storage, database } = require("./firebase/server.js");
const { ServerAdapter } = require("./adapters/ServerAdapter.js");
const { FireModel } = require("./FireModel.js");

FireModel.setAdapter(new ServerAdapter());

module.exports = { firestore, auth, storage, database, FireModel };
