import { AppleHealthImportService } from "../services/apple-health-import-service.js";
import { FamilyMemberService } from "../services/family-member-service.js";
import { createFamilyMemberRepository } from "../repositories/family-member-repository.js";

const repository = createFamilyMemberRepository();
const familyMemberService = new FamilyMemberService(repository);
const service = new AppleHealthImportService(familyMemberService);

process.on("message", async (message) => {
  if (!message) {
    process.exit(1);
    return;
  }

  const {
    jobId,
    familyMemberId,
    folderPath,
    importScope,
    mode
  } = message;

  try {
    const result =
      mode === "preview"
        ? await service.previewLatestZip({ familyMemberId, folderPath, importScope })
        : await service.importLatestZip({ familyMemberId, folderPath, importScope });

    process.send?.({
      type: "success",
      jobId,
      result
    });
    process.exit(0);
  } catch (error) {
    process.send?.({
      type: "error",
      jobId,
      error: error.message || "Apple Health 工作失敗"
    });
    process.exit(1);
  }
});
