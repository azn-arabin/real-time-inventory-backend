import sequelize from "../config/database";
import "../../models";
import { seedDatabase } from "./seed";

async function main() {
  await sequelize.sync({ alter: true });
  await seedDatabase();
  await sequelize.close();
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
