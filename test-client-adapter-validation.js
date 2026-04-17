/**
 * ClientAdapter でのバリデーションエラーハンドリングをテストします。
 *
 * 実行方法:
 *   node test-client-adapter-validation.js
 */

import { BaseClass } from "./src/BaseClass.js";

// テスト用のクラスを作成
class TestModel extends BaseClass {
  static collectionPath = "test";

  static classProps = {
    name: { type: String, required: true, label: "名前" },
    age: {
      type: Number,
      required: true,
      validator: (val) => val >= 0,
      label: "年齢",
    },
    email: { type: String, length: { min: 5, max: 100 }, label: "メール" },
  };
}

console.log("=== ValidationError のテスト ===\n");

// テストケース1: required エラー
console.log("【テスト1】required エラー");
const model1 = new TestModel();
model1.age = 25;
try {
  model1.validate();
  console.log("❌ エラーがスローされませんでした");
} catch (err) {
  console.log("✅ エラーがスローされました");
  console.log("  - err.name:", err.name);
  console.log("  - err.message:", err.message);
  console.log(
    "  - err.validationErrors:",
    JSON.stringify(err.validationErrors, null, 2),
  );
}

console.log("\n" + "=".repeat(50) + "\n");

// テストケース2: validator エラー
console.log("【テスト2】validator エラー");
const model2 = new TestModel();
model2.name = "テスト太郎";
model2.age = -5;
try {
  model2.validate();
  console.log("❌ エラーがスローされませんでした");
} catch (err) {
  console.log("✅ エラーがスローされました");
  console.log("  - err.name:", err.name);
  console.log("  - err.message:", err.message);
  console.log(
    "  - err.validationErrors:",
    JSON.stringify(err.validationErrors, null, 2),
  );
}

console.log("\n" + "=".repeat(50) + "\n");

// テストケース3: length エラー
console.log("【テスト3】length エラー");
const model3 = new TestModel();
model3.name = "テスト太郎";
model3.age = 30;
model3.email = "abc"; // 5文字未満
try {
  model3.validate();
  console.log("❌ エラーがスローされませんでした");
} catch (err) {
  console.log("✅ エラーがスローされました");
  console.log("  - err.name:", err.name);
  console.log("  - err.message:", err.message);
  console.log(
    "  - err.validationErrors:",
    JSON.stringify(err.validationErrors, null, 2),
  );
}

console.log("\n" + "=".repeat(50) + "\n");

// テストケース4: 複数のエラー
console.log("【テスト4】複数のエラー");
const model4 = new TestModel();
model4.age = -10;
model4.email = "x";
try {
  model4.validate();
  console.log("❌ エラーがスローされませんでした");
} catch (err) {
  console.log("✅ エラーがスローされました");
  console.log("  - err.name:", err.name);
  console.log("  - err.message:", err.message);
  console.log("  - err.validationErrors:");
  err.validationErrors.forEach((e, i) => {
    console.log(
      `    [${i}] code: ${e.code}, field: ${e.field}, message: ${e.message}`,
    );
  });
}

console.log("\n" + "=".repeat(50) + "\n");

// テストケース5: バリデーション成功
console.log("【テスト5】バリデーション成功");
const model5 = new TestModel();
model5.name = "テスト太郎";
model5.age = 25;
model5.email = "test@example.com";
try {
  model5.validate();
  console.log("✅ バリデーション成功（エラーなし）");
} catch (err) {
  console.log("❌ 予期しないエラー:", err.message);
}

console.log("\n=== テスト完了 ===");
