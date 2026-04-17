/**
 * ClientAdapter のエラーハンドリングをテストします。
 *
 * このテストは、catchブロックでValidationErrorが正しくClientAdapterErrorに変換されるかを確認します。
 */

import {
  ClientAdapterError,
  ERRORS,
} from "../air-firebase-v2-client-adapter/error.js";

console.log("=== ClientAdapterError のテスト ===\n");

// テスト用のValidationErrorを作成
const createValidationError = () => {
  const error = new Error("名前 is required.\n年齢 is required.");
  error.name = "ValidationError";
  error.validationErrors = [
    { code: "REQUIRED_ERROR", message: "名前 is required.", field: "name" },
    { code: "REQUIRED_ERROR", message: "年齢 is required.", field: "age" },
  ];
  return error;
};

// テストケース1: ValidationError → ClientAdapterError 変換
console.log("【テスト1】ValidationError → ClientAdapterError 変換");
const validationError = createValidationError();
console.log("元のエラー:");
console.log("  - name:", validationError.name);
console.log("  - message:", validationError.message);

const clientError = new ClientAdapterError(
  ERRORS.VALIDATION_FIELD_ERROR,
  validationError,
);
console.log("\nClientAdapterError に変換後:");
console.log("  - name:", clientError.name);
console.log("  - code:", clientError.code);
console.log("  - message:", clientError.message);
console.log("  - userMessage:", clientError.userMessage);
console.log("  - originalError.name:", clientError.originalError?.name);
console.log(
  "  - originalError.validationErrors:",
  clientError.originalError?.validationErrors,
);

console.log("\n" + "=".repeat(50) + "\n");

// テストケース2: catchブロックのシミュレーション
console.log("【テスト2】catchブロックのシミュレーション");

function simulateCreateMethod() {
  try {
    // 擬似的にvalidate()を呼び出してエラーをスロー
    throw createValidationError();
  } catch (err) {
    if (err instanceof ClientAdapterError) {
      throw err;
    } else if (err.name === "ValidationError") {
      console.log("✅ ValidationError を検出しました");
      throw new ClientAdapterError(ERRORS.VALIDATION_FIELD_ERROR, err);
    } else {
      console.log("❌ 未知のエラーです");
      throw new ClientAdapterError(ERRORS.SYSTEM_UNKNOWN_ERROR, err);
    }
  }
}

try {
  simulateCreateMethod();
  console.log("❌ エラーがスローされませんでした");
} catch (err) {
  console.log("✅ ClientAdapterError がスローされました");
  console.log("  - code:", err.code);
  console.log("  - userMessage:", err.userMessage);
  console.log('  - isCategory("VALIDATION"):', err.isCategory("VALIDATION"));
  console.log("  - 元のバリデーション詳細:");
  err.originalError?.validationErrors?.forEach((e, i) => {
    console.log(`    [${i}] ${e.field}: ${e.message}`);
  });
}

console.log("\n" + "=".repeat(50) + "\n");

// テストケース3: 通常のErrorの場合
console.log("【テスト3】通常のError（SYSTEM_UNKNOWN_ERROR）");

function simulateNetworkError() {
  try {
    const networkError = new Error("Network connection failed");
    networkError.name = "NetworkError";
    throw networkError;
  } catch (err) {
    if (err instanceof ClientAdapterError) {
      throw err;
    } else if (err.name === "ValidationError") {
      console.log("ValidationError を検出しました");
      throw new ClientAdapterError(ERRORS.VALIDATION_FIELD_ERROR, err);
    } else {
      console.log("✅ 未知のエラーを SYSTEM_UNKNOWN_ERROR に変換しました");
      throw new ClientAdapterError(ERRORS.SYSTEM_UNKNOWN_ERROR, err);
    }
  }
}

try {
  simulateNetworkError();
  console.log("❌ エラーがスローされませんでした");
} catch (err) {
  console.log("✅ ClientAdapterError がスローされました");
  console.log("  - code:", err.code);
  console.log("  - userMessage:", err.userMessage);
  console.log('  - isCategory("SYSTEM"):', err.isCategory("SYSTEM"));
  console.log("  - 元のエラー:", err.originalError?.message);
}

console.log("\n=== テスト完了 ===");
