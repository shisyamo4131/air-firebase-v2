/**
 * シンプルに air-firebase-v2 をインストールした Cloud Functions で
 * モジュールをインポートした際に Firebase が初期化されるかどうかを
 * 確認するためのモジュールです。
 * Firestore に FireModel というコレクションでドキュメントが作成されていれば
 * 初期化が出来ているということになります。
 * このモジュールを index.js でインポートして実行してください。
 *
 * const { firemodelTest } = require("./tests/firemodel-test");
 * firemodelTest();
 */
const { FireModel } = require("air-firebase-v2");

async function firemodelTest() {
  const model = new FireModel();
  const docRef = await model.create();
  console.log(docRef);
}

module.exports = { firemodelTest };
