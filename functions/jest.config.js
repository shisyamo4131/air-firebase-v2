module.exports = {
  setupFilesAfterEnv: ["./jest.setup.js"], // ✅ テスト前に Firestore のエミュレーター設定
  testEnvironment: "node", // ✅ Cloud Functions は Node.js で動作
};
