import { WebView } from "react-native-webview";
import { StyleSheet, ActivityIndicator, Linking, View } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const WEB_URL = "https://triply-app-ecru.vercel.app/";

/** supertoss://, kakaopay:// 는 WebView 안에서 열지 않고 네이티브 앱으로 위임 */
const DEEP_LINK_SCHEMES = ["supertoss://", "kakaopay://"];

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <WebView
          source={{ uri: WEB_URL }}
          style={styles.webview}
          onShouldStartLoadWithRequest={(request) => {
            const isDeepLink = DEEP_LINK_SCHEMES.some((scheme) =>
              request.url.startsWith(scheme),
            );
            if (isDeepLink) {
              Linking.openURL(request.url).catch(() => {});
              return false;
            }
            return true;
          }}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#E8432D" />
            </View>
          )}
          startInLoadingState
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDE8DF",
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EDE8DF",
  },
});
