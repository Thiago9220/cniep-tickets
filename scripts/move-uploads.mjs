import fs from "fs";
import fsp from "fs/promises";
import path from "path";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: pnpm move-uploads <destination> [--set-env]");
    process.exit(1);
  }

  const destArg = args[0];
  const setEnv = args.includes("--set-env") || process.env.SET_ENV === "1";

  const repoRoot = process.cwd();
  const src = path.resolve(repoRoot, "apps", "api", "uploads");
  const dest = path.resolve(destArg);

  if (!fs.existsSync(src)) {
    console.error(`Source directory not found: ${src}`);
    process.exit(1);
  }

  await fsp.mkdir(dest, { recursive: true });

  console.log(`[move-uploads] Copying from`);
  console.log(`  SRC: ${src}`);
  console.log(`  DST: ${dest}`);

  // Node 16+ supports fs.cp
  await fsp.cp(src, dest, { recursive: true, force: true });

  console.log("[move-uploads] Copy completed.");

  if (setEnv) {
    const envPath = path.resolve(repoRoot, ".env");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = await fsp.readFile(envPath, "utf8");
    }

    const line = `UPLOADS_DIR=${dest}`;
    if (content.includes("UPLOADS_DIR=")) {
      content = content.replace(/^(UPLOADS_DIR=).*$/m, line);
    } else {
      content = content.trimEnd() + (content.endsWith("\n") ? "" : "\n") + line + "\n";
    }
    await fsp.writeFile(envPath, content, "utf8");
    console.log(`[move-uploads] Updated .env with ${line}`);
  } else {
    console.log("[move-uploads] Tip: run with --set-env to update .env automatically.");
  }

  console.log("[move-uploads] Done.");
}

main().catch((err) => {
  console.error("[move-uploads] Error:", err?.message || err);
  process.exit(1);
});

