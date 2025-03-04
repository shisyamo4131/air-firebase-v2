// scripts/rename.js
const fs = require("fs");
const path = require("path");

const [, , targetDir, newExt] = process.argv;

if (!targetDir || !newExt) {
  console.error("Usage: node scripts/rename.js <targetDir> <newExt>");
  process.exit(1);
}

const dirPath = path.resolve(__dirname, `../dist/${targetDir}`);

if (!fs.existsSync(dirPath)) {
  console.error(`❌ Directory not found: ${dirPath}`);
  process.exit(1);
}

fs.readdirSync(dirPath).forEach((file) => {
  const oldPath = path.join(dirPath, file);
  const newPath = path.join(dirPath, file.replace(/\.js$/, `.${newExt}`));
  if (fs.statSync(oldPath).isFile() && file.endsWith(".js")) {
    fs.renameSync(oldPath, newPath);
    console.log(`✅ Renamed: ${oldPath} → ${newPath}`);
  }
});
