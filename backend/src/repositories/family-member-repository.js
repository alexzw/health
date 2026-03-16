import { env } from "../config/env.js";
import { InMemoryFamilyMemberRepository } from "./in-memory-family-member-repository.js";
import { PostgresFamilyMemberRepository } from "./postgres-family-member-repository.js";

export function createFamilyMemberRepository() {
  if (env.databaseUrl) {
    return new PostgresFamilyMemberRepository();
  }

  return new InMemoryFamilyMemberRepository();
}

