
import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "mysql",
  host:  "mysql",
  port: 3306,
  username:  "root",
  password: "welcome@123",
  database: "quicksale",
  synchronize: false,
  logging: false,
  entities: [__dirname + "/../**/entity/*.{ts,js}"],
  migrations: [__dirname + "/../**/migration/*.{ts,js}"]
});
