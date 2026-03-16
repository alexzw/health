import { HttpError } from "../lib/http-error.js";
import { parseAppleHealthExport } from "../integrations/apple-health-parser.js";

export class AppleHealthImportService {
  constructor(familyMemberService) {
    this.familyMemberService = familyMemberService;
  }

  async importFile({ familyMemberId, xmlString }) {
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

    let importedRecordCount = 0;
    let importedWorkoutCount = 0;

    for (const record of records) {
      await this.familyMemberService.addHealthRecord(familyMemberId, record);
      importedRecordCount += 1;
    }

    for (const workout of workouts) {
      await this.familyMemberService.addExerciseLog(familyMemberId, workout);
      importedWorkoutCount += 1;
    }

    return {
      familyMemberId,
      importedRecordCount,
      importedWorkoutCount
    };
  }
}

