import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { HttpError } from "../lib/http-error.js";

const execFileAsync = promisify(execFile);
const defaultAppleHealthFolder =
  path.join(
    os.homedir(),
    "Library",
    "Mobile Documents",
    "com~apple~CloudDocs",
    "Apple Health"
  );

export function getDefaultAppleHealthFolder() {
  return defaultAppleHealthFolder;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (_error) {
    return false;
  }
}

function buildFolderCandidates({ familyMemberId, memberName }) {
  const candidates = new Set();
  const normalizedId = String(familyMemberId || "").trim();
  const normalizedName = String(memberName || "").trim();

  if (normalizedName) {
    candidates.add(normalizedName);
  }

  if (normalizedId) {
    candidates.add(normalizedId);
    candidates.add(normalizedId.charAt(0).toUpperCase() + normalizedId.slice(1));
  }

  if (normalizedId === "amelie") {
    candidates.add("Emily");
  }

  return [...candidates];
}

export async function resolveAppleHealthFolderPath({
  folderPath = defaultAppleHealthFolder,
  familyMemberId,
  memberName
}) {
  const candidates = buildFolderCandidates({ familyMemberId, memberName });

  for (const candidate of candidates) {
    const candidatePath = path.join(folderPath, candidate);
    if (await pathExists(candidatePath)) {
      return candidatePath;
    }
  }

  return folderPath;
}

async function findLatestZipFile(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const zipFiles = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".zip"))
      .map(async (entry) => {
        const fullPath = path.join(folderPath, entry.name);
        const stats = await fs.stat(fullPath);
        return {
          fullPath,
          mtimeMs: stats.mtimeMs
        };
      })
  );

  zipFiles.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return zipFiles[0] || null;
}

async function findExportXmlPath(zipPath) {
  const { stdout } = await execFileAsync("/usr/bin/unzip", ["-Z1", zipPath]);
  const matches = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((entry) => entry.toLowerCase().endsWith("export.xml"));

  return matches[0] || null;
}

export async function extractAppleHealthXmlFromLatestZip(folderPath = defaultAppleHealthFolder) {
  const latestZip = await findLatestZipFile(folderPath);

  if (!latestZip) {
    throw new HttpError(404, "指定資料夾內找不到 Apple Health zip 檔");
  }

  const exportXmlPath = await findExportXmlPath(latestZip.fullPath);

  if (!exportXmlPath) {
    throw new HttpError(400, "zip 檔內找不到 export.xml");
  }

  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "apple-health-import-"));

  await execFileAsync(
    "/usr/bin/unzip",
    ["-o", latestZip.fullPath, exportXmlPath, "-d", tempDirectory],
    {
      maxBuffer: 1024 * 1024 * 20
    }
  );

  const extractedXmlPath = path.join(tempDirectory, exportXmlPath);

  return {
    zipPath: latestZip.fullPath,
    exportXmlPath,
    xmlFilePath: extractedXmlPath,
    cleanup: async () => {
      await fs.rm(tempDirectory, { recursive: true, force: true });
    }
  };
}
