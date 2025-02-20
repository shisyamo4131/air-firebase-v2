class FireModel {
  // アダプター
  static adapter = null

  constructor(collectionId) {
    this.collectionId = collectionId
  }

  /**
   * set Client or Server's adapter to FireModel.
   * @param {ClientAdapter} adapter
   */
  static setAdapter(adapter) {
    FireModel.adapter = adapter
  }

  /**
   * get Client or Server's adapter from FireModel.
   */
  static getAdapter() {
    if (!FireModel.adapter) {
      throw new Error(
        'Firestore adapter is not set. Call FireModel.setAdapter first.'
      )
    }
    return FireModel.adapter
  }

  async create(data) {
    return await FireModel.getAdapter().create(this.collectionId, data)
  }

  async get(id) {
    return await FireModel.getAdapter().get(this.collectionId, id)
  }

  async update(id, data) {
    return await FireModel.getAdapter().update(this.collectionId, id, data)
  }

  async delete(id) {
    return await FireModel.getAdapter().delete(this.collectionId, id)
  }
}

module.exports = FireModel
