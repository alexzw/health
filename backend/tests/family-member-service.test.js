import test from "node:test";
import assert from "node:assert/strict";
import { FamilyMemberService } from "../src/services/family-member-service.js";

test("FamilyMemberService lists family members from the repository", async () => {
  const repository = {
    async list() {
      return [
        {
          id: "alex",
          name: "Alex",
          dateOfBirth: "1992-02-21",
          gender: "Male",
          familyRole: "Father",
          healthDataRecords: []
        }
      ];
    },
    async findById() {
      return null;
    },
    async findMetricTrendByMemberId() {
      return [];
    }
  };

  const service = new FamilyMemberService(repository);
  const result = await service.listFamilyMembers();

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "alex");
});

test("FamilyMemberService returns a single family member when present", async () => {
  const repository = {
    async list() {
      return [];
    },
    async findById(id) {
      return {
        id,
        name: "Ryan",
        dateOfBirth: "2019-09-05",
        gender: "Male",
        familyRole: "Child",
        healthDataRecords: []
      };
    },
    async findMetricTrendByMemberId() {
      return [];
    }
  };

  const service = new FamilyMemberService(repository);
  const result = await service.getFamilyMember("ryan");

  assert.equal(result.id, "ryan");
  assert.equal(result.name, "Ryan");
  assert.equal(result.gender, "Male");
  assert.equal(result.familyRole, "Child");
  assert.equal(result.age >= 6, true);
  assert.equal(result.dateOfBirthDisplay.includes("2019"), true);
});

test("FamilyMemberService can answer coach questions without optional body measurements", async () => {
  const repository = {
    async list() {
      return [];
    },
    async findById(id) {
      return {
        id,
        name: "Alex",
        dateOfBirth: "1992-02-21",
        gender: "Male",
        familyRole: "Father",
        healthDataRecords: [],
        exerciseLogs: [],
        latestMetrics: {
          weight: {
            value: 78.4,
            unit: "kg",
            recordedAt: "2026-03-10T08:00:00Z"
          }
        }
      };
    },
    async findMetricTrendByMemberId() {
      return [];
    }
  };

  const service = new FamilyMemberService(repository);
  const member = await service.getFamilyMember("alex");
  const answer = await service.askCoachQuestion("alex", "我應該先睇邊個指標？", "zh");

  assert.equal(member.id, "alex");
  assert.equal(typeof answer.reply.answer, "string");
  assert.equal(answer.reply.answer.includes("現階段最值得先做"), true);
});
