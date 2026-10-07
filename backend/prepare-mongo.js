import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.MONGOMS_DOWNLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '.mongo');
const { MongoBinary } = await import('mongodb-memory-server');
const binary = await MongoBinary.getPath();
console.log(`MongoDB binary ready at ${binary}`);
