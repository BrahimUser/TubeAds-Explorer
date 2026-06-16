import RNFS from 'react-native-fs';

/**
 * YouTube upload + (optional) playlist insertion.
 *
 * Extracted verbatim from the original monolithic `App.tsx` (lines 74-373).
 * Behaviour is unchanged so you can compare git diffs side-by-side; only
 * the surrounding wiring (form fields, navigation, Firestore write) moved.
 *
 * NOTE on playlists:
 *   The marketplace flow no longer needs `addVideoToPlaylist` — Firestore
 *   is the source of truth for "which videos are visible to users". The
 *   helper is kept here so you can re-enable it from `PostAdScreen` with
 *   one line of code if you ever want a moderator playlist.
 */

/**
 * Normalize a recorder file path into a `file://` URI that React Native's
 * native FormData implementation can stream from disk on both platforms.
 */
export function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

/** Return the last 8 chars of a token (or '<empty>') for safe-ish logging. */
export function tokenTail(token: string | null | undefined): string {
  if (!token) return '<empty>';
  return token.slice(-8);
}

/** Build the public YouTube thumbnail URL for a given video id. */
export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Result of `addVideoToPlaylist`.
 *
 * Same shape as the original — kept for callers that still want full
 * diagnostic output. Marketplace `PostAdScreen` does NOT call this.
 */
export type PlaylistInsertResult = {
  ok: boolean;
  status: number | null;
  errorBody: string | null;
  tokensMatch: boolean;
  ownsPlaylist: boolean | null;
  playlistIdSent: string;
  uploadTokenTail: string;
  playlistTokenTail: string;
  summary: string;
};

/**
 * Adds the freshly uploaded `videoId` to the given playlist via
 * `playlistItems.insert`. See the original docstring in `App.tsx` for the
 * full rationale around the structured (non-throwing) return shape.
 */
export async function addVideoToPlaylist(
  videoId: string,
  playlistId: string,
  playlistAccessToken: string,
  uploadAccessToken: string,
): Promise<PlaylistInsertResult> {
  const tokensMatch =
    !!playlistAccessToken && playlistAccessToken === uploadAccessToken;
  const uploadTokenTail = tokenTail(uploadAccessToken);
  const playlistTokenTail = tokenTail(playlistAccessToken);

  const requestBody = {
    snippet: {
      playlistId,
      resourceId: {
        kind: 'youtube#video',
        videoId,
      },
    },
  };

  let status: number | null = null;
  let errorBody: string | null = null;
  let ok = false;

  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${playlistAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );
    status = response.status;
    if (response.ok) {
      ok = true;
    } else {
      errorBody = await response.text().catch(() => '<unreadable response body>');
    }
  } catch (err) {
    errorBody = `Network error: ${(err as Error)?.message ?? String(err)}`;
  }

  let ownsPlaylist: boolean | null = null;
  if (!ok) {
    try {
      const ownership = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=id&id=${encodeURIComponent(
          playlistId,
        )}&mine=true`,
        {
          headers: {
            Authorization: `Bearer ${playlistAccessToken}`,
            Accept: 'application/json',
          },
        },
      );
      if (ownership.ok) {
        const data = await ownership.json().catch(() => null);
        const items = Array.isArray(data?.items) ? data.items : [];
        ownsPlaylist = items.length > 0;
      }
    } catch {
      // ownership probe is best-effort
    }
  }

  const summaryLines: string[] = [];
  if (ok) {
    summaryLines.push('playlistItems.insert: OK');
  } else {
    summaryLines.push(`playlistItems.insert FAILED (HTTP ${status ?? 'n/a'})`);
  }
  summaryLines.push(`playlistId sent       : ${playlistId}`);
  summaryLines.push(`videoId               : ${videoId}`);
  summaryLines.push(
    `Same token as upload? : ${tokensMatch ? 'YES (byte-identical)' : 'NO (DIFFERENT token!)'}`,
  );
  if (!ok) {
    summaryLines.push(
      ownsPlaylist === false
        ? 'Channel ownership      : signed-in channel does NOT own this playlist.'
        : ownsPlaylist === true
        ? 'Channel ownership      : signed-in channel DOES own this playlist.'
        : 'Channel ownership      : could not verify.',
    );
    summaryLines.push(`Raw error             : ${errorBody ?? '<none>'}`);
  }

  return {
    ok,
    status,
    errorBody,
    tokensMatch,
    ownsPlaylist,
    playlistIdSent: playlistId,
    uploadTokenTail,
    playlistTokenTail,
    summary: summaryLines.join('\n'),
  };
}

/**
 * Uploads a recorded video file to YouTube using only React Native built-ins
 * (`fetch` + `FormData`). See the original `App.tsx` for the long-form
 * rationale on why metadata is written to a temp file rather than passed as
 * a JS Blob — the gist is that RN's native FormData layer doesn't reliably
 * round-trip JS Blobs but does stream `{uri,type,name}` parts from disk.
 */
export async function uploadVideoToYouTube(params: {
  accessToken: string;
  filePath: string;
  title: string;
  description?: string;
  categoryId: string;
  privacyStatus: 'private' | 'unlisted' | 'public';
}): Promise<{ videoId?: string }> {
  const { accessToken, filePath, title, description, categoryId, privacyStatus } = params;

  const fileUri = toFileUri(filePath);

  const metadata = {
    snippet: {
      title,
      description: description ?? '',
      categoryId,
    },
    status: { privacyStatus },
  };

  const metadataPath = `${RNFS.CachesDirectoryPath}/yt-metadata-${Date.now()}.json`;
  await RNFS.writeFile(metadataPath, JSON.stringify(metadata), 'utf8');
  const metadataUri = `file://${metadataPath}`;

  const formData = new FormData();
  formData.append('snippet', {
    uri: metadataUri,
    type: 'application/json',
    name: 'snippet.json',
  } as unknown as Blob);
  formData.append('video', {
    uri: fileUri,
    type: 'video/mp4',
    name: 'video.mp4',
  } as unknown as Blob);

  let response: Response;
  try {
    response = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          // NOTE: do NOT set Content-Type here — RN auto-sets
          // `multipart/form-data; boundary=...` for FormData bodies.
        },
        body: formData,
      },
    );
  } catch (err) {
    RNFS.unlink(metadataPath).catch(() => undefined);
    throw err;
  }

  RNFS.unlink(metadataPath).catch(() => undefined);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Upload failed (${response.status}): ${text}`);
  }

  const result = await response.json().catch(() => null);
  const videoId: string | undefined = result?.id;
  return { videoId };
}
