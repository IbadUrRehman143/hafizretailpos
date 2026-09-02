INSERT INTO "Branch" ("id", "name", "code", "createdAt", "updatedAt")
VALUES ('br_main_01', 'Main Branch', 'MAIN01', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "Role" ("id", "name", "description", "createdAt", "updatedAt")
VALUES ('role_super_admin', 'SUPER_ADMIN', 'Super Admin Access', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "AppUser" ("id", "name", "email", "password", "roleId", "branchId", "isActive", "createdAt", "updatedAt")
VALUES (
  'user_super_admin',
  'Ibad Khan',
  'ibadurrehman010@gmail.com',
  '$2a$10$7R446Q0k2cR1w28oQ.QOQO1Jj8gS3T2rJq2rN3M5L6K7J8I9H0G1F', 
  (SELECT "id" FROM "Role" WHERE "name" = 'SUPER_ADMIN' LIMIT 1),
  (SELECT "id" FROM "Branch" LIMIT 1),
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "password" = '$2a$10$7R446Q0k2cR1w28oQ.QOQO1Jj8gS3T2rJq2rN3M5L6K7J8I9H0G1F',
  "isActive" = true;