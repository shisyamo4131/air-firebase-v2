import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const isDebug = process.env.DEBUG;

if (!isDebug) {
  jest.spyOn(console, "error").mockImplementation(() => {});
}
