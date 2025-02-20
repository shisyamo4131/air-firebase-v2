/**
 * サーバー側で使用する FireModel のアダプターです。
 * FireModel に Firestore に対する CRUD 機能を注入します。
 */
const { firestore } = require("../firebase/server");
const { logger } = require("firebase-functions");
const DEBUG = true;

class ServerAdapter {
  async create(collectionPath, data) {
    if (DEBUG) logger.debug(`[FireModel-server] create is called.`);
    const colRef = firestore.collection(collectionPath);
    const docRef = await colRef.add(data);
    return { id: docRef.id, ...data };
  }

  async get(collectionPath, id) {
    const docRef = firestore.collection(collectionPath).doc(id);
    const docSnap = await docRef.get();
    return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async update(collectionPath, id, data) {
    const docRef = firestore.collection(collectionPath).doc(id);
    await docRef.update(data);
    return { id, ...data };
  }

  async delete(collectionPath, id) {
    const docRef = firestore.collection(collectionPath).doc(id);
    await docRef.delete();
  }
}

module.exports = new ServerAdapter();
