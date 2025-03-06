/**
 * サーバー側のエントリーポイントです。
 * FireModel に ServerAdapter をセットし、各種サービスのインスタンスとともに
 * 提供します。
 */
import { firestore, auth, storage, database } from "./firebase/server.js";
import ServerAdapter from "./adapters/ServerAdapter.js";
import FireModel from "./FireModel.js";

FireModel.setAdapter(new ServerAdapter());

export { firestore, auth, storage, database, FireModel };
