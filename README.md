# Triply Native — Expo WebView 래퍼

Triply 웹앱을 iOS / Android 앱으로 패키징하는 Expo 프로젝트입니다.

## 소개

- react-native-webview로 Triply 웹앱을 감싸는 최소 래퍼
- 네이티브 딥링크(토스, 카카오페이) 처리
- EAS Build로 App Store / Play Store 배포

## 기술 스택

| 역할 | 기술 |
|---|---|
| 프레임워크 | Expo (React Native) |
| WebView | react-native-webview |
| 빌드 | EAS Build |
| 배포 | App Store / Google Play |

## 로컬 실행 방법

```bash
# 의존성 설치
npm install

# iOS 시뮬레이터 실행 (Mac 전용)
npx expo run:ios

# Android 에뮬레이터 실행
npx expo run:android

# Expo Go로 실행 (개발용)
npx expo start
```

> iOS 빌드는 Xcode, Android 빌드는 Android Studio가 필요합니다.

## 빌드 방법 (EAS Build)

```bash
# EAS CLI 설치
npm install -g eas-cli

# Expo 계정 로그인
eas login

# 개발 빌드
eas build --profile development --platform all

# 프로덕션 빌드
eas build --profile production --platform all

# 스토어 제출
eas submit --platform ios
eas submit --platform android
```

빌드 설정은 `eas.json`에서 관리합니다.
