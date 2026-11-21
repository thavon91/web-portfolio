let levelData = null;

export async function downloadPrivateLevel(client) {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw new Error('Please sign in again.');
  const { data, error } = await client.storage.from('2000-assets').download('level.glb');
  if (error || !data) {
    throw new Error('Unable to download the level. This account may not be approved, or the connection failed.');
  }
  const buffer = await data.arrayBuffer();
  if (buffer.byteLength < 12 || new DataView(buffer).getUint32(0, true) !== 0x46546c67) {
    throw new Error('The uploaded level is not a valid GLB file.');
  }
  levelData = buffer;
}

export function takePrivateLevel() {
  if (!levelData) throw new Error('Sign in and download the private level first.');
  const data = levelData;
  levelData = null;
  return data;
}
