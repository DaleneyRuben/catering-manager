'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TYPE "enum_users_role" RENAME TO "enum_users_role_old"');
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_users_role" AS ENUM ('super_admin', 'admin', 'kitchen', 'delivery')`,
    );

    // Existing admins keep full access under the new name; existing managers had the same
    // scope the new 'admin' role has (everything except Usuarios/Health), so they map there.
    await queryInterface.sequelize.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "enum_users_role"
      USING (
        CASE "role"::text
          WHEN 'admin' THEN 'super_admin'
          WHEN 'manager' THEN 'admin'
          ELSE "role"::text
        END
      )::"enum_users_role"
    `);

    await queryInterface.sequelize.query('DROP TYPE "enum_users_role_old"');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TYPE "enum_users_role" RENAME TO "enum_users_role_new"');
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_users_role" AS ENUM ('admin', 'manager', 'delivery')`,
    );

    await queryInterface.sequelize.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "enum_users_role"
      USING (
        CASE "role"::text
          WHEN 'super_admin' THEN 'admin'
          WHEN 'admin' THEN 'manager'
          WHEN 'kitchen' THEN 'manager'
          ELSE "role"::text
        END
      )::"enum_users_role"
    `);

    await queryInterface.sequelize.query('DROP TYPE "enum_users_role_new"');
  },
};
