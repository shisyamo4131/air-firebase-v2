/**
 * 指定した文字列フィールドから1文字および2文字のN-gramを生成し、tokenMapを構築して返します。
 *
 * @param {string[]} fields - tokenMap生成対象のプロパティ名の配列
 * @param {object} instance - 対象インスタンスオブジェクト
 * @returns {{ [token: string]: true } | null}
 *   生成したtokenMapオブジェクト（トークンなしならnull）
 */
export function generateTokenMap(fields = [], instance) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return null;
  }

  // N-gramトークンを一意に保持
  const tokenMap = new Map();

  // サニタイズ：高サロゲート／低サロゲート／記号／空白を除去
  const sanitize = (text) =>
    text.replace(/[\uD800-\uDBFF]|[\uDC00-\uDFFF]|~|\*|\[|\]|\s+/g, "");

  for (const field of fields) {
    const raw = instance[field];
    if (typeof raw !== "string" || !raw) continue;

    const str = sanitize(raw);
    const len = str.length;

    for (let i = 0; i < len; i++) {
      // 1文字トークン
      tokenMap.set(str.substring(i, i + 1), true);

      // 2文字トークン（範囲内でのみ）
      if (i + 2 <= len) {
        tokenMap.set(str.substring(i, i + 2), true);
      }
    }
  }

  // Map → オブジェクトに変換。サイズ0ならnull
  return tokenMap.size > 0 ? Object.fromEntries(tokenMap) : null;
}
