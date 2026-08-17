const { execSync } = require("child_process");
const path = require("path");

const prismaCli = path.join(__dirname, "node_modules", "prisma", "build", "index.js");

try {
  console.log("Generating Prisma client...");
  const output = execSync(`"${process.execPath}" "${prismaCli}" generate`, {
    cwd: __dirname,
    env: { ...process.env, PRISMA_TELEMETRY_INFORMATION: "0", CI: "1" },
    encoding: "utf-8",
  });
  console.log(output);
} catch (err) {
  console.error("Error generating prisma:", err.stdout || err.message);
}
