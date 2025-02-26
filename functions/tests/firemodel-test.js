const { FireModel } = require("air-firebase-v2");

async function firemodelTest() {
  const model = new FireModel();
  const docRef = await model.create();
  console.log(docRef);
}

module.exports = { firemodelTest };
