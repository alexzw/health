export function createFamilyMemberController(service) {
  return {
    list: async (_request, response, next) => {
      try {
        const members = await service.listFamilyMembers();
        response.json({ data: members });
      } catch (error) {
        next(error);
      }
    },
    getById: async (request, response, next) => {
      try {
        const member = await service.getFamilyMember(request.params.id);

        if (!member) {
          response.status(404).json({
            error: "Family member not found"
          });
          return;
        }

        response.json({ data: member });
      } catch (error) {
        next(error);
      }
    },
    getGrowthTracking: async (request, response, next) => {
      try {
        const growthTracking = await service.getGrowthTracking(request.params.id);

        if (!growthTracking) {
          response.status(404).json({
            error: "Family member not found"
          });
          return;
        }

        response.json({ data: growthTracking });
      } catch (error) {
        next(error);
      }
    },
    updateById: async (request, response, next) => {
      try {
        const member = await service.updateFamilyMember(request.params.id, request.body);

        if (!member) {
          response.status(404).json({
            error: "找不到家庭成員"
          });
          return;
        }

        response.json({ data: member });
      } catch (error) {
        next(error);
      }
    },
    createHealthRecord: async (request, response, next) => {
      try {
        const record = await service.addHealthRecord(request.params.id, request.body);

        if (!record) {
          response.status(404).json({
            error: "找不到家庭成員"
          });
          return;
        }

        response.status(201).json({ data: record });
      } catch (error) {
        next(error);
      }
    },
    updateHealthRecord: async (request, response, next) => {
      try {
        const record = await service.updateHealthRecord(
          request.params.id,
          request.params.recordId,
          request.body
        );

        if (!record) {
          response.status(404).json({
            error: "找不到要更新的健康紀錄"
          });
          return;
        }

        response.json({ data: record });
      } catch (error) {
        next(error);
      }
    },
    createGrowthMeasurement: async (request, response, next) => {
      try {
        const measurement = await service.addGrowthMeasurement(request.params.id, request.body);

        if (!measurement) {
          response.status(404).json({
            error: "找不到家庭成員"
          });
          return;
        }

        response.status(201).json({ data: measurement });
      } catch (error) {
        next(error);
      }
    },
    updateGrowthMeasurement: async (request, response, next) => {
      try {
        const measurement = await service.updateGrowthMeasurement(
          request.params.id,
          request.params.measurementId,
          request.body
        );

        if (!measurement) {
          response.status(404).json({
            error: "找不到要更新的成長紀錄"
          });
          return;
        }

        response.json({ data: measurement });
      } catch (error) {
        next(error);
      }
    },
    createExerciseLog: async (request, response, next) => {
      try {
        const exerciseLog = await service.addExerciseLog(request.params.id, request.body);

        if (!exerciseLog) {
          response.status(404).json({
            error: "找不到家庭成員"
          });
          return;
        }

        response.status(201).json({ data: exerciseLog });
      } catch (error) {
        next(error);
      }
    },
    updateExerciseLog: async (request, response, next) => {
      try {
        const exerciseLog = await service.updateExerciseLog(
          request.params.id,
          request.params.exerciseLogId,
          request.body
        );

        if (!exerciseLog) {
          response.status(404).json({
            error: "找不到要更新的運動紀錄"
          });
          return;
        }

        response.json({ data: exerciseLog });
      } catch (error) {
        next(error);
      }
    }
  };
}
