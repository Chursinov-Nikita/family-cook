import { copyFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("out");

const files = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? files(full) : [full];
    }),
  );
  return nested.flat();
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "_next") continue;
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith("__next.")) {
      for (const file of await files(full)) {
        const flat = path.relative(full, file).split(path.sep).join(".");
        await copyFile(file, path.join(dir, `${entry.name}.${flat}`));
      }
    } else {
      await walk(full);
    }
  }
};

await walk(root);
