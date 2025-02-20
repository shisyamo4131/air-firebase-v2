const { FireModel } = require("air-firebase-v2");

async function firemodelTest() {
  const model = new FireModel("test_collection");
  const data = { name: "Test User", age: 30 };
  const createdData = await model.create(data);
  const docData = await model.get(createdData.id);
  const updatedData = await model.update(createdData.id, {
    ...docData,
    name: "Tommy",
  });
  await model.delete(updatedData.id);
}

module.exports = { firemodelTest };
