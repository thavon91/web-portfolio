import { privateAssetPaths } from './privateAssetPaths.js';

const urls = new Map();
export const hasPrivateAsset = (path) => urls.has(path);

export function privateAssetUrl(path) {
  const url = urls.get(path);
  if (!url) throw new Error(`Private game asset not available: ${path}`);
  return url;
}

export async function preparePrivateAssets(client, onProgress = () => {}) {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('Please sign in again.');
  const pending = privateAssetPaths.filter((path) => !urls.has(path));
  let next = 0;
  let completed = privateAssetPaths.length - pending.length;
  let failure = null;
  await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
    while (next < pending.length && !failure) {
      const path = pending[next++];
      try {
        const { data, error: downloadError } = await client.storage.from('uro-assets').download(path);
        if (downloadError || !data) {
          console.warn('URO private asset download failed:', path, downloadError);
          throw new Error('Unable to load game files. Check your URO account access and connection, then try again.');
        }
        urls.set(path, URL.createObjectURL(data));
        onProgress(++completed, privateAssetPaths.length);
      } catch (error) { failure = error; }
    }
  }));
  if (failure) {
    releasePrivateAssets();
    throw failure;
  }
}

export function releasePrivateAssets() {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
}
