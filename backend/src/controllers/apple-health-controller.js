export function createAppleHealthController(service) {
  return {
    previewFile: async (request, response, next) => {
      try {
        const result = await service.previewFile({
          familyMemberId: request.body.familyMemberId,
          xmlString: request.file?.buffer?.toString("utf8") || ""
        });

        response.json({ data: result });
      } catch (error) {
        next(error);
      }
    },
    importFile: async (request, response, next) => {
      try {
        const result = await service.importFile({
          familyMemberId: request.body.familyMemberId,
          xmlString: request.file?.buffer?.toString("utf8") || ""
        });

        response.status(201).json({ data: result });
      } catch (error) {
        next(error);
      }
    },
    previewLatestZip: async (request, response, next) => {
      try {
        const result = await service.previewLatestZip({
          familyMemberId: request.body.familyMemberId,
          folderPath: request.body.folderPath
        });

        response.json({ data: result });
      } catch (error) {
        next(error);
      }
    },
    importLatestZip: async (request, response, next) => {
      try {
        const result = await service.importLatestZip({
          familyMemberId: request.body.familyMemberId,
          folderPath: request.body.folderPath
        });

        response.status(201).json({ data: result });
      } catch (error) {
        next(error);
      }
    }
  };
}
