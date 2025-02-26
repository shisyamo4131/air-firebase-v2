/**
 * emulators 環境で jest を使用するための設定です。
 * NOTE: 手探り状態なので不要な設定があるかもしれません。
 *       少なくとも FIREBASE_CONFIG.databaseURL は必須です。
 */
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"; // ✅ Firestore のエミュレーターを使用
process.env.GCLOUD_PROJECT = "air-firebase-v2"; // ✅ Firebase プロジェクト ID
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: "air-firebase-v2",
  databaseURL: "https://air-firebase-v2.firebaseio.com",
});
