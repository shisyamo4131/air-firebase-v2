/**
 * サーバー（Cloud Functions）側の Firebase アプリケーションを初期化し、各種サービスへのインスタンスを提供します。
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { getDatabase } from "firebase-admin/database";

const app = getApps()[0] || initializeApp();

const firestore = getFirestore();
const auth = getAuth();
const storage = getStorage();
const database = getDatabase();

export { app, auth, database, firestore, storage };
