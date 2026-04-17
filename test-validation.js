/**
 * BaseClass のバリデーション機能テストスクリプト
 */
import { BaseClass } from "./src/BaseClass.js";

// テスト用のクラスを定義
class TestModel extends BaseClass {
  static classProps = {
    name: {
      type: String,
      default: "",
      required: true,
      label: "名前",
    },
    age: {
      type: Number,
      default: 0,
      label: "年齢",
    },
    description: {
      type: String,
      default: "",
      length: 100,
      label: "説明",
    },
    items: {
      type: Array,
      default: () => [],
      required: true,
      label: "アイテム",
    },
    email: {
      type: String,
      default: "",
      label: "メールアドレス",
      validator: (value) => {
        if (!value) return true; // 空は許可
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return "有効なメールアドレスを入力してください。";
        }
        return true;
      },
    },
  };
}

console.log("========================================");
console.log("BaseClass バリデーション機能テスト");
console.log("========================================\n");

// テストケース1: 空のインスタンス（requiredエラー）
console.log("【テストケース1】空のインスタンス");
const model1 = new TestModel();
console.log("name:", model1.name);
console.log("items:", model1.items);
console.log("isInvalid:", model1.isInvalid);
console.log("invalidReasons:", model1.invalidReasons);
console.log(
  "detailedInvalidReasons:",
  JSON.stringify(model1.detailedInvalidReasons, null, 2),
);
console.log();

// テストケース2: nameのみ設定（itemsのrequiredエラー）
console.log("【テストケース2】nameのみ設定");
const model2 = new TestModel({ name: "山田太郎" });
console.log("name:", model2.name);
console.log("items:", model2.items);
console.log("isInvalid:", model2.isInvalid);
console.log("invalidReasons:", model2.invalidReasons);
console.log(
  "detailedInvalidReasons:",
  JSON.stringify(model2.detailedInvalidReasons, null, 2),
);
console.log();

// テストケース3: lengthエラー
console.log("【テストケース3】descriptionの長さ超過");
const model3 = new TestModel({
  name: "山田太郎",
  items: ["item1"],
  description: "a".repeat(101), // 101文字
});
console.log("description.length:", model3.description.length);
console.log("isInvalid:", model3.isInvalid);
console.log("invalidReasons:", model3.invalidReasons);
console.log(
  "detailedInvalidReasons:",
  JSON.stringify(model3.detailedInvalidReasons, null, 2),
);
console.log();

// テストケース4: カスタムバリデーターエラー
console.log("【テストケース4】カスタムバリデーター（メール形式エラー）");
const model4 = new TestModel({
  name: "山田太郎",
  items: ["item1"],
  email: "invalid-email",
});
console.log("email:", model4.email);
console.log("isInvalid:", model4.isInvalid);
console.log("invalidReasons:", model4.invalidReasons);
console.log(
  "detailedInvalidReasons:",
  JSON.stringify(model4.detailedInvalidReasons, null, 2),
);
console.log();

// テストケース5: 全て正常
console.log("【テストケース5】全て正常");
const model5 = new TestModel({
  name: "山田太郎",
  age: 30,
  description: "テスト用の説明",
  items: ["item1", "item2"],
  email: "test@example.com",
});
console.log("isInvalid:", model5.isInvalid);
console.log("invalidReasons:", model5.invalidReasons);
console.log("detailedInvalidReasons:", model5.detailedInvalidReasons);
console.log();

// テストケース6: validate()メソッドのテスト
console.log("【テストケース6】validate()メソッド - エラー時");
const model6 = new TestModel();
try {
  model6.validate();
  console.log("validate() passed");
} catch (error) {
  console.log("validate() threw error:");
  console.log(error.message);
}
console.log();

// テストケース7: validate()メソッドのテスト - 正常時
console.log("【テストケース7】validate()メソッド - 正常時");
const model7 = new TestModel({
  name: "山田太郎",
  items: ["item1"],
});
try {
  model7.validate();
  console.log("validate() passed ✓");
} catch (error) {
  console.log("validate() threw error:");
  console.log(error.message);
}
console.log();

console.log("========================================");
console.log("テスト完了");
console.log("========================================");
