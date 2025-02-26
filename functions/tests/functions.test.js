const functions = require("firebase-functions-test")({
  projectId: "your-project-id",
});
const myFunction = require("../index"); // ✅ Cloud Functions のエントリポイントを指定

describe("Cloud Functions のテスト", () => {
  afterAll(() => {
    functions.cleanup(); // ✅ テスト終了後に Firebase のテスト環境をクリーンアップ
  });

  test("正常にデータを作成する", async () => {
    const req = { body: { name: "テストユーザー" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await myFunction.someCloudFunction(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ message: "成功" });
  });
});
