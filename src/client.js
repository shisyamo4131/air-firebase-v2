/**
 * アプリ側のエントリーポイントです。
 * FireModel に ClientAdapter をセットし、各種サービスのインスタンスとともに
 * 提供します。
 */
import {
  firestore,
  auth,
  storage,
  database,
  functions,
} from "./firebase/client.js";

import ClientAdapter from "./adapters/ClientAdapter.js";
import FireModel from "./FireModel.js";

FireModel.setAdapter(ClientAdapter);

export { firestore, auth, storage, database, functions, FireModel };
