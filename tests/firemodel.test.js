const { FireModel } = require("../src/client");
const { terminateFirebase } = require("../src/firebase/client");

describe("FireModel クライアントテスト", () => {
  // beforeAll(() => {
  //   FireModel.setAdapter(ClientAdapter);
  // });

  test("データを作成できる", async () => {
    const model = new FireModel("test_collection");
    const data = { name: "Test User", age: 30 };

    const createdData = await model.create(data);
    expect(createdData).toHaveProperty("id");
    expect(createdData.name).toBe("Test User");
  });

  test("データを取得できる", async () => {
    const model = new FireModel("test_collection");
    const createdData = await model.create({ name: "John Doe", age: 25 });

    const retrievedData = await model.get(createdData.id);
    expect(retrievedData).not.toBeNull();
    expect(retrievedData.name).toBe("John Doe");
  });

  test("データを更新できる", async () => {
    const model = new FireModel("test_collection");
    const createdData = await model.create({ name: "Jane Doe", age: 20 });

    await model.update(createdData.id, { age: 22 });
    const updatedData = await model.get(createdData.id);
    expect(updatedData.age).toBe(22);
  });

  test("データを削除できる", async () => {
    const model = new FireModel("test_collection");
    const createdData = await model.create({ name: "Test User", age: 30 });

    await model.delete(createdData.id);
    const deletedData = await model.get(createdData.id);
    expect(deletedData).toBeNull();
  });

  afterAll(() => {
    terminateFirebase();
  });
});
