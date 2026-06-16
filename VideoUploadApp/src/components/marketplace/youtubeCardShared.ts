import { Linking, Platform } from 'react-native';

/** Remote iframe HTML for `react-native-youtube-iframe` (v2.x). */
export const RN_YOUTUBE_IFRAME_HTML =
  'https://lonelycpp.github.io/react-native-youtube-iframe/iframe_v2.html';

export function createYoutubeCardNavigationHandler() {
  return (request: { url: string; mainDocumentURL?: string }) => {
    const url = request.mainDocumentURL || request.url;
    if (!url) return true;
    if (Platform.OS === 'ios' && url === 'about:blank') return true;
    if (
      url.startsWith('https://www.youtube.com/') ||
      url.startsWith('https://youtube.com/') ||
      url.startsWith('https://m.youtube.com/') ||
      url.startsWith('https://youtu.be/')
    ) {
      void Linking.openURL(url).catch(() => undefined);
      return false;
    }
    return url.startsWith(RN_YOUTUBE_IFRAME_HTML) || url === 'about:blank';
  };
}

export const INLINE_YOUTUBE_PARAMS = {
  controls: true,
  modestbranding: true,
  rel: false,
  preventFullScreen: true,
} as const;
