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
    }
  };
}
