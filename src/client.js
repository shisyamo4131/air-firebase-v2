/**
 * アプリ側のエントリーポイントです。
 * FireModel に ClientAdapter をセットし、各種サービスのインスタンスとともに提供します。
 */
import {
  initializeFirebase,
  firestore,
  auth,
  storage,
  database,
  functions,
} from "./firebase/client.js";
import ClientAdapter from "./adapters/ClientAdapter.js";
import FireModel from "./FireModel.js";

// Nuxt プラグインで Firebase が初期化されている前提
// FireModel.setAdapter(new ClientAdapter());

export {
  initializeFirebase,
  firestore,
  auth,
  storage,
  database,
  functions,
  FireModel,
  ClientAdapter,
};
