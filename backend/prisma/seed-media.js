/**
 * Royalty-free media URLs for development/demo seeding.
 * Sources: Pexels Videos, Pixabay Videos, Unsplash, Pexels Photos,
 *          Random User API, Pravatar.
 *
 * URLs are stored here only — no files are downloaded.
 */

const UNSPLASH = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&h=600&q=80`;

const PEXELS_PHOTO = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;

const PEXELS_VIDEO = (id, fps = 30) => ({
  source: 'pexels',
  mp4: `https://videos.pexels.com/video-files/${id}/${id}-hd_1920_1080_${fps}fps.mp4`,
  poster: `https://images.pexels.com/videos/${id}/pictures/preview-0.jpg`,
  pageUrl: `https://www.pexels.com/video/${id}/`,
});

/** @type {Record<string, { source: string, mp4: string, poster: string, pageUrl: string }>} */
export const STOCK_VIDEOS = {
  agriculture: PEXELS_VIDEO(1409899, 25),
  vehicles: PEXELS_VIDEO(3571264, 30),
  vehiclesAlt: PEXELS_VIDEO(854913, 25),
  realEstate: PEXELS_VIDEO(2169880, 30),
  electronics: PEXELS_VIDEO(3129671, 30),
  fashion: PEXELS_VIDEO(6911910, 25),
  home: PEXELS_VIDEO(5155396, 30),
  kidsBaby: PEXELS_VIDEO(2098989, 30),
  rugs: PEXELS_VIDEO(3045163, 25),
  services: PEXELS_VIDEO(856973, 25),
  general: PEXELS_VIDEO(1409899, 25),
  // Pixabay secondary — Pixabay Content License
  pixabaySunset: {
    source: 'pixabay',
    mp4: 'https://cdn.pixabay.com/vimeo/128427/sunset-128427.mp4',
    poster: UNSPLASH('photo-1477959857157-b9fa12a9bc1b'),
    pageUrl: 'https://pixabay.com/videos/sunset-sunrise-sky-128427/',
  },
};

/** Product stills by marketplace category — Unsplash primary, Pexels secondary. */
export const PRODUCT_IMAGES = {
  Agriculture: [
    UNSPLASH('photo-1625246333195-78d9c38ad449'),
    UNSPLASH('photo-1500937386664-56d1dfef3074'),
    PEXELS_PHOTO(2132247),
    PEXELS_PHOTO(265216),
    PEXELS_PHOTO(1329574),
  ],
  Vehicles: [
    UNSPLASH('photo-1492144534655-ae79c964c9d7'),
    UNSPLASH('photo-1503376780353-7e6692767b70'),
    PEXELS_PHOTO(170811),
    PEXELS_PHOTO(1149137),
    PEXELS_PHOTO(1643383),
  ],
  'Real Estate': [
    UNSPLASH('photo-1560518883-ce09059eeffa'),
    UNSPLASH('photo-1502672260266-1c1ef2d93688'),
    PEXELS_PHOTO(271624),
    PEXELS_PHOTO(1571460),
    PEXELS_PHOTO(1396122),
  ],
  Electronics: [
    UNSPLASH('photo-1511707171634-5f897ff02aa9'),
    UNSPLASH('photo-1468495244123-6c6c332eeece'),
    PEXELS_PHOTO(1092644),
    PEXELS_PHOTO(788946),
    PEXELS_PHOTO(181939),
  ],
  Fashion: [
    UNSPLASH('photo-1445205170230-053b83016050'),
    UNSPLASH('photo-1503454537195-1dcabb73ffb9'),
    PEXELS_PHOTO(985635),
    PEXELS_PHOTO(1926769),
    PEXELS_PHOTO(1536619),
  ],
  Home: [
    UNSPLASH('photo-1555041469-a586c61ea9bc'),
    UNSPLASH('photo-1586023492125-27b2c045efd7'),
    PEXELS_PHOTO(1571460),
    PEXELS_PHOTO(276583),
    PEXELS_PHOTO(1350789),
  ],
  'Kids & Baby': [
    UNSPLASH('photo-1503454537195-1dcabb73ffb9'),
    UNSPLASH('photo-1519689680058-324335c77eba'),
    PEXELS_PHOTO(366139),
    PEXELS_PHOTO(3608268),
    PEXELS_PHOTO(3875089),
  ],
  Rugs: [
    UNSPLASH('photo-1600166898405-da9535204843'),
    UNSPLASH('photo-1600585154340-be6161a56a0c'),
    PEXELS_PHOTO(1090638),
    PEXELS_PHOTO(1457842),
    PEXELS_PHOTO(6580705),
  ],
  Services: [
    UNSPLASH('photo-1581578731548-c64695cc6952'),
    UNSPLASH('photo-1621905251189-08b45d6a269e'),
    PEXELS_PHOTO(4480501),
    PEXELS_PHOTO(5691502),
    PEXELS_PHOTO(6476587),
  ],
  Jobs: [
    UNSPLASH('photo-1521737711867-e3b97375f902'),
    UNSPLASH('photo-1600880292203-757bb62b4baf'),
    PEXELS_PHOTO(3182812),
    PEXELS_PHOTO(3184291),
    PEXELS_PHOTO(3184339),
  ],
  Others: [
    UNSPLASH('photo-1571019614242-c5c5dee9f50b'),
    UNSPLASH('photo-1571902942392-10059863a558'),
    PEXELS_PHOTO(1005638),
    PEXELS_PHOTO(248547),
    PEXELS_PHOTO(863988),
  ],
};

/**
 * User avatars — Random User API (primary) and Pravatar (fallback).
 * @see https://randomuser.me/documentation
 */
export const USER_AVATARS = {
  superAdmin: { url: 'https://i.pravatar.cc/256?img=68', source: 'pravatar' },
  admin: { url: 'https://randomuser.me/api/portraits/men/75.jpg', source: 'randomuser' },
  sellerPro1: { url: 'https://randomuser.me/api/portraits/women/65.jpg', source: 'randomuser' },
  sellerPro2: { url: 'https://randomuser.me/api/portraits/men/32.jpg', source: 'randomuser' },
  sellerPro3: { url: 'https://randomuser.me/api/portraits/women/44.jpg', source: 'randomuser' },
  sellerPro4: { url: 'https://randomuser.me/api/portraits/men/52.jpg', source: 'randomuser' },
  sellerPro5: { url: 'https://randomuser.me/api/portraits/women/28.jpg', source: 'randomuser' },
  sellerPro6: { url: 'https://randomuser.me/api/portraits/men/22.jpg', source: 'randomuser' },
  sellerPro7: { url: 'https://randomuser.me/api/portraits/women/89.jpg', source: 'randomuser' },
  sellerPro8: { url: 'https://randomuser.me/api/portraits/men/41.jpg', source: 'randomuser' },
  sellerReg1: { url: 'https://randomuser.me/api/portraits/women/12.jpg', source: 'randomuser' },
  sellerReg2: { url: 'https://randomuser.me/api/portraits/men/18.jpg', source: 'randomuser' },
  sellerReg3: { url: 'https://randomuser.me/api/portraits/women/33.jpg', source: 'randomuser' },
  sellerReg4: { url: 'https://randomuser.me/api/portraits/men/64.jpg', source: 'randomuser' },
  buyer1: { url: 'https://randomuser.me/api/portraits/women/47.jpg', source: 'randomuser' },
  buyer2: { url: 'https://randomuser.me/api/portraits/men/36.jpg', source: 'randomuser' },
  buyer3: { url: 'https://randomuser.me/api/portraits/women/71.jpg', source: 'randomuser' },
  buyer4: { url: 'https://i.pravatar.cc/256?img=15', source: 'pravatar' },
};

/** Chat attachment stills — product detail shots. */
export const CHAT_IMAGES = [
  UNSPLASH('photo-1511707171634-5f897ff02aa9'),
  UNSPLASH('photo-1492144534655-ae79c964c9d7'),
  UNSPLASH('photo-1600166898405-da9535204843'),
];

/** Default video key per listing category when blueprint omits videoKey. */
export const CATEGORY_VIDEO_KEY = {
  Agriculture: 'agriculture',
  Vehicles: 'vehicles',
  'Real Estate': 'realEstate',
  Electronics: 'electronics',
  Fashion: 'fashion',
  Home: 'home',
  'Kids & Baby': 'kidsBaby',
  Rugs: 'rugs',
  Services: 'services',
  Jobs: null,
  Others: 'general',
};

function hashSeed(seed) {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pickFrom(list, seed, offset = 0) {
  if (!list?.length) return '';
  return list[(hashSeed(seed) + offset) % list.length];
}

export function getVideo(videoKey) {
  if (!videoKey) return null;
  return STOCK_VIDEOS[videoKey] || null;
}

export function getAvatarForUserKey(userKey) {
  return USER_AVATARS[userKey]?.url || `https://i.pravatar.cc/256?u=${encodeURIComponent(userKey)}`;
}

/**
 * Resolve listing media: MP4 video URL, poster thumbnail, and gallery stills.
 */
export function resolveListingMedia(blueprint) {
  const videoKey = blueprint.videoKey === null
    ? null
    : (blueprint.videoKey ?? CATEGORY_VIDEO_KEY[blueprint.category] ?? null);

  const video = videoKey ? getVideo(videoKey) : null;
  const pool = PRODUCT_IMAGES[blueprint.category] || PRODUCT_IMAGES.Others;
  const gallery = [];
  const imageCount = blueprint.status === 'REJECTED'
    ? 0
    : blueprint.status === 'PENDING' && !video
      ? 1
      : video
        ? 2
        : 3;

  for (let i = 0; i < imageCount; i++) {
    gallery.push(pickFrom(pool, `${blueprint.key}-img-${i}`, i));
  }

  const thumbnailUrl = video?.poster || gallery[0] || pickFrom(pool, blueprint.key);
  const videoUrl = video?.mp4 || '';

  return {
    videoUrl,
    thumbnailUrl,
    youtubeVideoId: '',
    gallery,
    videoSource: video?.source || null,
  };
}
