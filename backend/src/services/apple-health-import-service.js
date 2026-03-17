import { HttpError } from "../lib/http-error.js";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { splitDuplicates } from "../lib/apple-health-dedupe.js";
import {
  parseAppleHealthExport,
  parseAppleHealthExportFile
} from "../integrations/apple-health-parser.js";
import {
  extractAppleHealthXmlFromLatestZip,
  getDefaultAppleHealthFolder,
  resolveAppleHealthFolderPath
} from "../integrations/apple-health-zip.js";

export class AppleHealthImportService {
  constructor(familyMemberService) {
    this.familyMemberService = familyMemberService;
    this.jobs = new Map();
  }

  normalizeImportScope(scope) {
    return scope === "all" ? "all" : "30d";
  }

  getDefaultSinceDate(days = 30) {
    const now = new Date();
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  getSinceDateForScope(scope) {
    const normalizedScope = this.normalizeImportScope(scope);
    return normalizedScope === "all" ? null : this.getDefaultSinceDate();
  }

  createJob({ kind, familyMemberId, memberName, importScope }) {
    const id = `apple-health-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const job = {
      id,
      kind,
      familyMemberId,
      memberName,
      importScope: this.normalizeImportScope(importScope),
      status: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: null,
      error: ""
    };
    this.jobs.set(id, job);
    return job;
  }

  updateJob(id, patch) {
    const current = this.jobs.get(id);
    if (!current) {
      return null;
    }

    const next = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    this.jobs.set(id, next);
    return next;
  }

  getJob(id) {
    const job = this.jobs.get(id);
    if (!job) {
      throw new HttpError(404, "找不到 Apple Health 工作");
    }

    return job;
  }

  async startLatestZipJob({ familyMemberId, folderPath, importScope, mode }) {
    const member = await this.familyMemberService.getFamilyMember(familyMemberId);

    if (!member) {
      throw new HttpError(404, "找不到要匯入的家庭成員");
    }

    const job = this.createJob({
      kind: mode === "preview" ? "preview-latest" : "import-latest",
      familyMemberId,
      memberName: member.name,
      importScope
    });

    this.runLatestZipJobInChild({
      jobId: job.id,
      familyMemberId,
      folderPath,
      importScope,
      mode
    });

    return {
      jobId: job.id,
      kind: job.kind,
      status: job.status,
      familyMemberId,
      memberName: member.name,
      importScope: job.importScope
    };
  }

  runLatestZipJobInChild({ jobId, familyMemberId, folderPath, importScope, mode }) {
    const workerPath = fileURLToPath(new URL("../workers/apple-health-latest-job.js", import.meta.url));
    const child = fork(workerPath, [], {
      stdio: ["ignore", "ignore", "ignore", "ipc"]
    });

    this.updateJob(jobId, { status: "running" });

    child.on("message", (message) => {
      if (!message || message.jobId !== jobId) {
        return;
      }

      if (message.type === "success") {
        this.updateJob(jobId, {
          status: "completed",
          result: message.result,
          error: ""
        });
      }

      if (message.type === "error") {
        this.updateJob(jobId, {
          status: "failed",
          error: message.error || "Apple Health 工作失敗"
        });
      }
    });

    child.on("exit", (code) => {
      const job = this.jobs.get(jobId);
      if (!job || job.status === "completed" || job.status === "failed") {
        return;
      }

      this.updateJob(jobId, {
        status: "failed",
        error: code === 0 ? "Apple Health 工作已結束但沒有回傳結果" : "Apple Health 工作意外中斷"
      });
    });

    child.send({
      jobId,
      familyMemberId,
      folderPath: folderPath || null,
      importScope,
      mode
    });
  }

  async previewFile({ familyMemberId, xmlString }) {
    if (!familyMemberId) {
      throw new HttpError(400, "請先選擇要匯入到哪位家庭成員");
    }

    if (!xmlString) {
      throw new HttpError(400, "請上傳 Apple Health 匯出檔");
    }

    const member = await this.familyMemberService.getFamilyMember(familyMemberId);

    if (!member) {
      throw new HttpError(404, "找不到要匯入的家庭成員");
    }

    const { records, workouts } = parseAppleHealthExport(xmlString);
    const dedupe = splitDuplicates({
      existingRecords: member.healthDataRecords || [],
      existingExerciseLogs: member.exerciseLogs || [],
      incomingRecords: records,
      incomingWorkouts: workouts
    });

    return {
      familyMemberId,
      memberName: member.name,
      preview: {
        newRecordCount: dedupe.newRecords.length,
        duplicateRecordCount: dedupe.duplicateRecords.length,
        newWorkoutCount: dedupe.newWorkouts.length,
        duplicateWorkoutCount: dedupe.duplicateWorkouts.length,
        sampleRecords: dedupe.newRecords.slice(0, 5),
        sampleWorkouts: dedupe.newWorkouts.slice(0, 5)
      }
    };
  }

  async importFile({ familyMemberId, xmlString }) {
    const preview = await this.previewFile({ familyMemberId, xmlString });
    const member = await this.familyMemberService.getFamilyMember(familyMemberId);
    const { records, workouts } = parseAppleHealthExport(xmlString);
    const dedupe = splitDuplicates({
      existingRecords: member.healthDataRecords || [],
      existingExerciseLogs: member.exerciseLogs || [],
      incomingRecords: records,
      incomingWorkouts: workouts
    });

    let importedRecordCount = 0;
    let importedWorkoutCount = 0;

    for (const record of dedupe.newRecords) {
      await this.familyMemberService.addHealthRecord(familyMemberId, record);
      importedRecordCount += 1;
    }

    for (const workout of dedupe.newWorkouts) {
      await this.familyMemberService.addExerciseLog(familyMemberId, workout);
      importedWorkoutCount += 1;
    }

    return {
      familyMemberId,
      memberName: preview.memberName,
      importedRecordCount,
      importedWorkoutCount,
      skippedDuplicateRecordCount: dedupe.duplicateRecords.length,
      skippedDuplicateWorkoutCount: dedupe.duplicateWorkouts.length
    };
  }

  async previewLatestZip({ familyMemberId, folderPath, importScope }) {
    const member = await this.familyMemberService.getFamilyMember(familyMemberId);

    if (!member) {
      throw new HttpError(404, "找不到要匯入的家庭成員");
    }

    const resolvedFolderPath = await resolveAppleHealthFolderPath({
      folderPath: folderPath || getDefaultAppleHealthFolder(),
      familyMemberId,
      memberName: member.name
    });
    const extraction = await extractAppleHealthXmlFromLatestZip(resolvedFolderPath);
    let preview;
    const normalizedScope = this.normalizeImportScope(importScope);
    const sinceDate = this.getSinceDateForScope(normalizedScope);

    try {
      preview = await this.previewExtractedFile({
        familyMemberId,
        xmlFilePath: extraction.xmlFilePath,
        sinceDate
      });
    } finally {
      await extraction.cleanup();
    }

    return {
      ...preview,
      source: {
        folderPath: resolvedFolderPath,
        zipPath: extraction.zipPath,
        exportXmlPath: extraction.exportXmlPath,
        importScope: normalizedScope,
        sinceDate: sinceDate ? sinceDate.toISOString() : null
      }
    };
  }

  async importLatestZip({ familyMemberId, folderPath, importScope }) {
    const member = await this.familyMemberService.getFamilyMember(familyMemberId);

    if (!member) {
      throw new HttpError(404, "找不到要匯入的家庭成員");
    }

    const resolvedFolderPath = await resolveAppleHealthFolderPath({
      folderPath: folderPath || getDefaultAppleHealthFolder(),
      familyMemberId,
      memberName: member.name
    });
    const extraction = await extractAppleHealthXmlFromLatestZip(resolvedFolderPath);
    let result;
    const normalizedScope = this.normalizeImportScope(importScope);
    const sinceDate = this.getSinceDateForScope(normalizedScope);

    try {
      result = await this.importExtractedFile({
        familyMemberId,
        xmlFilePath: extraction.xmlFilePath,
        sinceDate
      });
    } finally {
      await extraction.cleanup();
    }

    return {
      ...result,
      source: {
        folderPath: resolvedFolderPath,
        zipPath: extraction.zipPath,
        exportXmlPath: extraction.exportXmlPath,
        importScope: normalizedScope,
        sinceDate: sinceDate ? sinceDate.toISOString() : null
      }
    };
  }

  async previewExtractedFile({ familyMemberId, xmlFilePath, sinceDate }) {
    if (!familyMemberId) {
      throw new HttpError(400, "請先選擇要匯入到哪位家庭成員");
    }

    const member = await this.familyMemberService.getFamilyMember(familyMemberId);

    if (!member) {
      throw new HttpError(404, "找不到要匯入的家庭成員");
    }

    const { records, workouts } = await parseAppleHealthExportFile(xmlFilePath, { sinceDate });
    const dedupe = splitDuplicates({
      existingRecords: member.healthDataRecords || [],
      existingExerciseLogs: member.exerciseLogs || [],
      incomingRecords: records,
      incomingWorkouts: workouts
    });

    return {
      familyMemberId,
      memberName: member.name,
      preview: {
        newRecordCount: dedupe.newRecords.length,
        duplicateRecordCount: dedupe.duplicateRecords.length,
        newWorkoutCount: dedupe.newWorkouts.length,
        duplicateWorkoutCount: dedupe.duplicateWorkouts.length,
        sampleRecords: dedupe.newRecords.slice(0, 5),
        sampleWorkouts: dedupe.newWorkouts.slice(0, 5)
      }
    };
  }

  async importExtractedFile({ familyMemberId, xmlFilePath, sinceDate }) {
    const preview = await this.previewExtractedFile({ familyMemberId, xmlFilePath, sinceDate });
    const member = await this.familyMemberService.getFamilyMember(familyMemberId);
    const { records, workouts } = await parseAppleHealthExportFile(xmlFilePath, { sinceDate });
    const dedupe = splitDuplicates({
      existingRecords: member.healthDataRecords || [],
      existingExerciseLogs: member.exerciseLogs || [],
      incomingRecords: records,
      incomingWorkouts: workouts
    });

    let importedRecordCount = 0;
    let importedWorkoutCount = 0;

    for (const record of dedupe.newRecords) {
      await this.familyMemberService.addHealthRecord(familyMemberId, record);
      importedRecordCount += 1;
    }

    for (const workout of dedupe.newWorkouts) {
      await this.familyMemberService.addExerciseLog(familyMemberId, workout);
      importedWorkoutCount += 1;
    }

    return {
      familyMemberId,
      memberName: preview.memberName,
      importedRecordCount,
      importedWorkoutCount,
      skippedDuplicateRecordCount: dedupe.duplicateRecords.length,
      skippedDuplicateWorkoutCount: dedupe.duplicateWorkouts.length
    };
  }
}
