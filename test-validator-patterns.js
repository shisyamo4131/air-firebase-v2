/**
 * validator の各パターンをテストする
 * - パターン1: オブジェクト返却 {code, message, messages: {ja}}
 * - パターン1': オブジェクト返却（一部省略）{code} のみ
 * - パターン2: 文字列返却
 * - パターン3: false 返却
 */

import { BaseClass } from "./index.js";

// テストクラス定義
class TestClass extends BaseClass {
  static collectionPath = "test";
  static classProps = {
    // パターン1: 完全なオブジェクト返却
    field1: {
      type: String,
      validator: (v) => {
        if (!v || v.length < 5) {
          return {
            code: "MIN_LENGTH_ERROR",
            message: "Please enter at least 5 characters.",
            messages: {
              ja: "5文字以上で入力してください。",
            },
          };
        }
        return true;
      },
    },
    // パターン1': codeのみ（messageとmessagesは省略）
    field2: {
      type: String,
      validator: (v) => {
        if (!v || v.length < 3) {
          return {
            code: "CUSTOM_ERROR",
          };
        }
        return true;
      },
    },
    // パターン2: 文字列返却
    field3: {
      type: String,
      validator: (v) => {
        if (!v || v.length < 2) {
          return "2文字以上で入力してください";
        }
        return true;
      },
    },
    // パターン3: false返却
    field4: {
      type: String,
      label: "フィールド4",
      validator: (v) => {
        if (!v || v.length < 1) {
          return false;
        }
        return true;
      },
    },
  };
}

console.log("=== Validator Pattern Test ===\n");

// テストインスタンス作成（すべてのフィールドでエラー発生）
const instance = new TestClass({
  field1: "abc", // 5文字未満
  field2: "ab", // 3文字未満
  field3: "a", // 2文字未満
  field4: "", // 1文字未満
});

console.log("【detailedInvalidReasons の結果】");
const errors = instance.detailedInvalidReasons;
errors.forEach((error, index) => {
  console.log(`\nエラー ${index + 1}:`);
  console.log(`  code: ${error.code}`);
  console.log(`  message: ${error.message}`);
  console.log(
    `  messages: ${JSON.stringify(error.messages, null, 2).replace(/\n/g, "\n  ")}`,
  );
  console.log(`  field: ${error.field}`);
});

console.log("\n\n【getInvalidReasons の結果】");
const reasons = instance.getInvalidReasons();
reasons.forEach((reason, index) => {
  console.log(`${index + 1}. ${reason}`);
});

console.log("\n\n【UI層での使用例】");
const locale = "ja"; // ユーザーの言語設定
console.log(`言語設定: ${locale}\n`);

errors.forEach((error, index) => {
  const displayMessage = error.messages[locale] || error.message;
  console.log(
    `${index + 1}. [${error.code}] ${displayMessage} (field: ${error.field})`,
  );
});

console.log("\n\n【validate() のテスト】");
try {
  instance.validate();
} catch (error) {
  console.log("ValidationError が正しくスローされました:");
  console.log(`  name: ${error.name}`);
  console.log(`  message: ${error.message}`);
  console.log(`  validationErrors: ${error.validationErrors.length}件`);
}

console.log("\n=== Test Complete ===");
