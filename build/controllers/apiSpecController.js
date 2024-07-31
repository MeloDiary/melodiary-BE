import YAML from 'yamljs';
import swaggerui from 'swagger-ui-express';
import path from 'path';
import { getDirname } from '../utils/getDirname.js';
const __dirname = getDirname(import.meta.url);
const apiSpecDoc = YAML.load(path.join(__dirname, '../../docs/API_spec.yaml'));
export const serveSwaggerUi = swaggerui.serve;
export const setupSwaggerUi = swaggerui.setup(apiSpecDoc);
