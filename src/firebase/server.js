/**
 * サーバー（Cloud Functions）側の Firebase アプリケーションを初期化し、各種サービスへのインスタンスを提供します。
 */

const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");
const { getDatabase } = require("firebase-admin/database");

const app = getApps()[0] || initializeApp();

const firestore = getFirestore();
const auth = getAuth();
const storage = getStorage();
const database = getDatabase();

module.exports = {
  app,
  auth,
  database,
  firestore,
  storage,
};
