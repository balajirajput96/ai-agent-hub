export function shouldRunMigrationCheck(environment) {
  return Boolean(environment.DATABASE_URL?.trim());
}

export function getMigrationCheckStatus(environment) {
  return shouldRunMigrationCheck(environment)
    ? null
    : "skipped_database_url_unavailable";
}
