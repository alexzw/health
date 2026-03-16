import { HttpError } from "../lib/http-error.js";
import { splitDuplicates } from "../lib/apple-health-dedupe.js";
import {
  parseAppleHealthExport,
  parseAppleHealthExportFile
} from "../integrations/apple-health-parser.js";
import {
  extractAppleHealthXmlFromLatestZip,
  getDefaultAppleHealthFolder
} from "../integrations/apple-health-zip.js";

export class AppleHealthImportService {
  constructor(familyMemberService) {
    this.familyMemberService = familyMemberService;
  }

  getDefaultSinceDate(days = 30) {
    const now = new Date();
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
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

  async previewLatestZip({ familyMemberId, folderPath }) {
    const extraction = await extractAppleHealthXmlFromLatestZip(folderPath || getDefaultAppleHealthFolder());
    let preview;
    const sinceDate = this.getDefaultSinceDate();

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
        folderPath: folderPath || getDefaultAppleHealthFolder(),
        zipPath: extraction.zipPath,
        exportXmlPath: extraction.exportXmlPath,
        sinceDate: sinceDate.toISOString()
      }
    };
  }

  async importLatestZip({ familyMemberId, folderPath }) {
    const extraction = await extractAppleHealthXmlFromLatestZip(folderPath || getDefaultAppleHealthFolder());
    let result;
    const sinceDate = this.getDefaultSinceDate();

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
        folderPath: folderPath || getDefaultAppleHealthFolder(),
        zipPath: extraction.zipPath,
        exportXmlPath: extraction.exportXmlPath,
        sinceDate: sinceDate.toISOString()
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
