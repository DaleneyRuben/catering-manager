'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TYPE "enum_users_role" RENAME TO "enum_users_role_old"');
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_users_role" AS ENUM ('super_admin', 'admin', 'kitchen', 'delivery', 'nutritionist')`,
    );

    await queryInterface.sequelize.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "enum_users_role"
      USING ("role"::text)::"enum_users_role"
    `);

    await queryInterface.sequelize.query('DROP TYPE "enum_users_role_old"');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TYPE "enum_users_role" RENAME TO "enum_users_role_new"');
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_users_role" AS ENUM ('super_admin', 'admin', 'kitchen', 'delivery')`,
    );

    await queryInterface.sequelize.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "enum_users_role"
      USING (
        CASE "role"::text
          WHEN 'nutritionist' THEN 'admin'
          ELSE "role"::text
        END
      )::"enum_users_role"
    `);

    await queryInterface.sequelize.query('DROP TYPE "enum_users_role_new"');
  },
};
