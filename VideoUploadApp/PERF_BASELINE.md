# Performance Baseline (pre-optimization)

Recorded before implementing the performance audit plan. Device profiling requires a physical device; static analysis values below.

## Architecture snapshot

- React Native 0.85.2, Hermes enabled, New Architecture enabled
- Home feed: ScrollView + `.map()` rendering up to 50 `ListingVideoCard` components
- Each card mounts a hidden `YoutubePlayer` WebView (opacity 0 when not playing)
- Concurrent pollers on home (logged in): listings 10s, favorites 8s, notifications 15s
- Forced splash minimum: 2200ms before AuthProvider mounts
- MainShell eager-imports all tab screens; tabs unmount on switch

## Estimated baseline metrics

| Metric | Estimated baseline |
|--------|-------------------|
| WebViews on home (idle) | 12–20+ (one per visible card) |
| Home scroll FPS | 30–45 on mid-range Android |
| Cold start TTI | 3–4s+ (2.2s splash + auth + MainShell chunk) |
| HTTP requests/min (home, logged in) | ~4–6 |
| React.memo usage | 0 components |

## Validation after optimization

Re-measure on device: home scroll FPS, WebView count (Android Studio), TTI, requests/min.
