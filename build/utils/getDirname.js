import { fileURLToPath } from 'url';
import { dirname } from 'path';
export function getDirname(metaUrl) {
    const __filename = fileURLToPath(metaUrl);
    return dirname(__filename);
}
