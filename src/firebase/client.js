/**
 * アプリ側の Firebase アプリケーションを初期化し、各種サービスへのインスタンスを提供します。
 * Firebase に接続するための環境変数は .env ファイルから読み込みます。
 */

import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "local"}` });

import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Firebase 設定を環境変数から取得
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  databaseURL: process.env.DATABASE_URL || "",
  vapidKey: process.env.VAPID_KEY || "",
};

// Cloud Functions のリージョン設定
const region = process.env.REGION || "us-central1";

// Firebase の初期化
if (getApps()[0]) {
  console.log("Firebase app is already initialized.");
} else {
  console.log("Firebase app is initialized.");
}
const app = getApps()[0] || initializeApp(firebaseConfig);

// Firebase サービスのインスタンスを取得
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const database = getDatabase(app);
const functions = getFunctions(app, region);

// Debug ログの制御
const DEBUG = process.env.DEBUG === "true";

// `local` 環境の場合は Firebase Emulator に接続
if (process.env.NODE_ENV === "local") {
  if (DEBUG) console.log("Using Firebase Emulators...");

  connectFirestoreEmulator(firestore, "localhost", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectStorageEmulator(storage, "localhost", 9199);
  connectDatabaseEmulator(database, "localhost", 9000);
  connectFunctionsEmulator(functions, "localhost", 5001);

  if (DEBUG) console.log("Connected to Firebase Emulators.");
}

// Firebase アプリの削除関数（Jest テスト用）
const terminateFirebase = async () => {
  if (getApps().length > 0) {
    await deleteApp(app);
    if (DEBUG)
      console.log(
        "Firebase app deleted successfully in Jest test environment."
      );
  }
};

export {
  app,
  auth,
  database,
  firestore,
  functions,
  storage,
  terminateFirebase,
};
