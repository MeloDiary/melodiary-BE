// API 명세서 서빙 controller
import YAML from 'yamljs';
import swaggerui from 'swagger-ui-express';
import path from 'path';
import { getDirname } from '../utils/getDirname.js';

/**
 * API 명세서를 Swagger UI로 제공하기 위해 사용되는 controller입니다.
 * 단순히 Swagger UI 모듈만 사용하기 때문에 service 레이어를 따로 만들지 않았습니다.
 */
const __dirname = getDirname(import.meta.url);
const apiSpecDoc = YAML.load(
  path.join(__dirname, '../../../docs/API_spec.yaml')
);

export const serveSwaggerUi = swaggerui.serve;
export const setupSwaggerUi = swaggerui.setup(apiSpecDoc);
