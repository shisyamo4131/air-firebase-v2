const { firestore } = require("../firebase/server");

class ServerAdapter {
  async create(collectionName, data) {
    const colRef = firestore.collection(collectionName);
    const docRef = await colRef.add(data);
    return { id: docRef.id, ...data };
  }

  async get(collectionName, id) {
    const docRef = firestore.collection(collectionName).doc(id);
    const docSnap = await docRef.get();
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async update(collectionName, id, data) {
    const docRef = firestore.collection(collectionName).doc(id);
    await docRef.update(data);
    return { id, ...data };
  }

  async delete(collectionName, id) {
    const docRef = firestore.collection(collectionName).doc(id);
    await docRef.delete();
  }
}

module.exports = new ServerAdapter();
