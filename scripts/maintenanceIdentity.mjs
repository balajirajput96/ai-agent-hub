import { basename } from "node:path";

const GITHUB_REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function getSafeRepositoryIdentity(environment, cwd) {
  const repository = environment.GITHUB_REPOSITORY;

  if (
    typeof repository === "string" &&
    GITHUB_REPOSITORY_PATTERN.test(repository)
  ) {
    return repository;
  }

  return `local:${basename(cwd)}`;
}
