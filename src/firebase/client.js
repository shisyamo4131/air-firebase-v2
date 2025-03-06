import { initializeApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

/** Firebase インスタンス */
let app, firestore, auth, storage, database, functions;

/**
 * Firebase を初期化する関数
 * @param {Object} config - Nuxt から渡される Firebase の設定オブジェクト
 */
export function initializeFirebase(config) {
  if (getApps().length === 0) {
    app = initializeApp(config);
    firestore = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    database = getDatabase(app);
    functions = getFunctions(app, config.region || "us-central1");

    // ローカル環境ならエミュレーターに接続
    if (process.env.NODE_ENV === "local") {
      console.log("Using Firebase Emulators...");

      connectFirestoreEmulator(firestore, "localhost", 8080);
      connectAuthEmulator(auth, "http://127.0.0.1:9099");
      connectStorageEmulator(storage, "localhost", 9199);
      connectDatabaseEmulator(database, "localhost", 9000);
      connectFunctionsEmulator(functions, "localhost", 5001);
    }
  }
}

// Firebase インスタンスをエクスポート
export { app, firestore, auth, storage, database, functions };
