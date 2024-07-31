import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * 현재 모듈의 디렉토리 경로를 리턴합니다.
 * 리턴된 경로는 CJS 모듈 방식의 __dirname과 동일합니다.
 * @param metaUrl - import.meta.url
 * @returns 디렉토리 경로
 */
export function getDirname(metaUrl: string): string {
  const __filename = fileURLToPath(metaUrl);
  return dirname(__filename);
}
