// database/sequelize.ts constructs its Sequelize at module load, and any domain that opens a
// transaction pulls it in transitively — so suites that never touch the DB still need the URL to
// be parseable. Constructing a Sequelize never connects; the first query would, and none runs.
process.env.DATABASE_URL ??= 'postgres://user:pass@localhost:5432/catering_manager_test';
