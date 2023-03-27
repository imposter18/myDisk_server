import path from "path";
import { fileURLToPath } from "url";

export const pathToServer = path.dirname(fileURLToPath(import.meta.url));
