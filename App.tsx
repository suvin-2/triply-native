import { useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import {
  BackHandler,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  View,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

const WEB_URL = "https://triply-app-ecru.vercel.app/";

/** 앱 미설치 시 대신 열 스토어 URL (iOS: App Store, Android: Play Store) */
const STORE_FALLBACK: Record<string, string> = {
  supertoss:
    Platform.OS === "ios"
      ? "https://apps.apple.com/app/toss/id839333328"
      : "https://play.google.com/store/apps/details?id=viva.republica.toss",
  kakaopay:
    Platform.OS === "ios"
      ? "https://apps.apple.com/app/id1494116725"
      : "https://play.google.com/store/apps/details?id=com.kakaopay.app",
};

/** 웹앱 홈 화면 여부 — pathname이 '/'이면 뒤로가기 대신 백그라운드로 */
function isHomeScreen(url: string) {
  try {
    return new URL(url).pathname === "/";
  } catch {
    return true;
  }
}

export default function App() {
  const webviewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(WEB_URL);

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && !isHomeScreen(currentUrl) && webviewRef.current) {
        webviewRef.current.goBack();
        return true; // 기본 동작(앱 종료/백그라운드) 방지
      }
      return false; // 홈이거나 히스토리 없으면 MainActivity가 백그라운드 처리
    });
    return () => handler.remove();
  }, [canGoBack, currentUrl]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <WebView
          ref={webviewRef}
          source={{ uri: WEB_URL }}
          style={styles.webview}
          onNavigationStateChange={(state) => {
            setCanGoBack(state.canGoBack);
            setCurrentUrl(state.url);
          }}
          onMessage={(event) => {
            void (async () => {
              try {
                const msg = JSON.parse(event.nativeEvent.data) as {
                  type: string;
                  url?: string;
                  data?: string;
                  filename?: string;
                };

                if (msg.type === "openDeepLink" && msg.url) {
                  const supported = await Linking.canOpenURL(msg.url);
                  if (supported) {
                    await Linking.openURL(msg.url);
                  } else {
                    const scheme = msg.url.split("://")[0];
                    const storeUrl = STORE_FALLBACK[scheme];
                    if (storeUrl) await Linking.openURL(storeUrl);
                  }
                }

                if (
                  msg.type === "saveImage" &&
                  msg.data &&
                  msg.filename
                ) {
                  // Android 13(API 33)+ READ_MEDIA_IMAGES 권한 필요
                  const { status, canAskAgain } =
                    await MediaLibrary.requestPermissionsAsync();
                  if (status !== "granted") {
                    if (!canAskAgain) {
                      // 이전에 영구 거부 — 설정 화면으로 유도
                      await Linking.openSettings();
                    } else {
                      webviewRef.current?.injectJavaScript(
                        `window.__triplyCallback && window.__triplyCallback({type:'imageError',message:'갤러리 저장 권한이 필요해요.'}); true;`,
                      );
                    }
                    return;
                  }
                  const cacheDir = FileSystem.cacheDirectory;
                  if (!cacheDir) throw new Error("캐시 디렉토리를 찾을 수 없어요.");
                  const fileUri = cacheDir + msg.filename;
                  await FileSystem.writeAsStringAsync(fileUri, msg.data, {
                    encoding: FileSystem.EncodingType.Base64,
                  });
                  await MediaLibrary.saveToLibraryAsync(fileUri);
                  webviewRef.current?.injectJavaScript(
                    `window.__triplyCallback && window.__triplyCallback({type:'imageSaved'}); true;`,
                  );
                }

                if (
                  msg.type === "shareImage" &&
                  msg.data &&
                  msg.filename
                ) {
                  // 공유는 cacheDirectory(앱 내부)를 쓰므로 갤러리 권한 불필요
                  const cacheDir = FileSystem.cacheDirectory;
                  if (!cacheDir) throw new Error("캐시 디렉토리를 찾을 수 없어요.");
                  const fileUri = cacheDir + msg.filename;
                  await FileSystem.writeAsStringAsync(fileUri, msg.data, {
                    encoding: FileSystem.EncodingType.Base64,
                  });
                  await Sharing.shareAsync(fileUri);
                  webviewRef.current?.injectJavaScript(
                    `window.__triplyCallback && window.__triplyCallback({type:'imageShared'}); true;`,
                  );
                }
              } catch (e) {
                console.error("[triply-native] 이미지 처리 오류:", e);
                webviewRef.current?.injectJavaScript(
                  `window.__triplyCallback && window.__triplyCallback({type:'imageError',message:'이미지 처리에 실패했어요. 다시 시도해주세요.'}); true;`,
                );
              }
            })();
          }}
          onShouldStartLoadWithRequest={(request) => {
            // postMessage 브릿지로 처리하지 못한 딥링크의 안전망
            const isDeepLink =
              request.url.startsWith("supertoss://") ||
              request.url.startsWith("kakaopay://");
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
    backgroundColor: "#ffffff",
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
    backgroundColor: "#ffffff",
  },
});
