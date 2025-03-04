module.exports = function (api) {
  api.cache(true);

  const presets = ["@babel/preset-env"];

  return {
    env: {
      esm: {
        presets: [["@babel/preset-env", { modules: false }]], // ✅ ESM の場合は `modules: false`
      },
      cjs: {
        presets: [["@babel/preset-env", { modules: "commonjs" }]], // ✅ CommonJS に変換
        plugins: ["@babel/plugin-transform-modules-commonjs"],
      },
    },
    ignore: [
      "functions/**", // functions ディレクトリを無視する
    ],
  };
};
