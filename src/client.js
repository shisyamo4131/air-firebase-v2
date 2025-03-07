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
import FireModel from "./FireModel.js";

export {
  initializeFirebase,
  firestore,
  auth,
  storage,
  database,
  functions,
  FireModel,
};
