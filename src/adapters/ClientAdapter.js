const {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} = require('firebase/firestore')
const { firestore } = require('../firebase/client')

class ClientAdapter {
  async create(collectionName, data) {
    const colRef = collection(firestore, collectionName)
    const docRef = await addDoc(colRef, data)
    return { id: docRef.id, ...data }
  }

  async get(collectionName, id) {
    const docRef = doc(firestore, collectionName, id)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  }

  async update(collectionName, id, data) {
    const docRef = doc(firestore, collectionName, id)
    await updateDoc(docRef, data)
    return { id, ...data }
  }

  async delete(collectionName, id) {
    const docRef = doc(firestore, collectionName, id)
    await deleteDoc(docRef)
  }
}

module.exports = new ClientAdapter()
