import { WebView } from "react-native-webview";
import { StyleSheet, View } from "react-native";

interface SpotifyEmbedProps {
  trackId: string;
  height?: number;
}

export function SpotifyEmbed({ trackId, height = 152 }: SpotifyEmbedProps) {
  const embedHtml = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;">
        <iframe
          src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0"
          width="100%"
          height="${height}"
          frameBorder="0"
          allowfullscreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style="border-radius:12px;"
        ></iframe>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: embedHtml }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 152,
    width: "100%",
    backgroundColor: "transparent",
  },
  webview: {
    backgroundColor: "transparent",
  },
});
