import app from "../src/app";
import { initializeDatabase } from "../src/database";

initializeDatabase();

export default function handler(req: any, res: any) {
  return app(req, res);
}