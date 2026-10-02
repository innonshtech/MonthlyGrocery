import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  videoUrl: string;
  width: number;
  height: number;
  paused?: boolean;
};

export default function ProductInlineVideo({ videoUrl, width, height, paused = false }: Props) {
  const html = useMemo(() => {
    const safeUrl = String(videoUrl || '').replace(/"/g, '&quot;');
    const autoplay = paused ? 'false' : 'true';
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #0F172A; }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #0F172A;
    }
  </style>
</head>
<body>
  <video
    id="v"
    src="${safeUrl}"
    controls
    playsinline
    webkit-playsinline
    ${autoplay === 'true' ? 'autoplay muted' : ''}
  ></video>
  <script>
    var v = document.getElementById('v');
    function sync() {
      if (${paused ? 'true' : 'false'}) { v.pause(); } else { v.play().catch(function(){}); }
    }
    document.addEventListener('visibilitychange', sync);
    sync();
  </script>
</body>
</html>`;
  }, [videoUrl, paused]);

  if (!videoUrl?.trim()) return null;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#22C55E" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
});
