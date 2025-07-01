# NormalMap-Online 배치 처리기

하나의 heightmap 이미지를 입력으로 받아서 4종류의 텍스처 맵을 자동으로 생성하는 Node.js 배치 처리 도구입니다.

## 🚀 빠른 시작

### 1. 환경 요구사항

- Node.js (v14 이상)
- npm
- Chrome/Chromium 브라우저 (Puppeteer 자동 설치)

### 2. 설치

```bash
git clone <repository-url>
cd NormalMap-Online
npm install
```

### 3. 이미지 준비

`input` 폴더에 heightmap 이미지들을 넣으세요.

**지원 형식**: PNG, JPG, JPEG, BMP, TIFF, TGA

```
input/
├── texture1.jpg
├── height_map.png
└── stone_surface.bmp
```

### 4. 배치 처리 실행

```bash
npm start
```

### 5. 결과 확인

`output` 폴더에서 생성된 4종류의 텍스처를 확인하세요:

```
output/
├── texture1_normal.png      # 노멀 맵
├── texture1_displacement.png # 디스플레이스먼트 맵
├── texture1_ambient.png     # 앰비언트 오클루전 맵
├── texture1_specular.png    # 스페큘러 맵
├── height_map_normal.png
├── height_map_displacement.png
├── height_map_ambient.png
├── height_map_specular.png
├── stone_surface_normal.png
├── stone_surface_displacement.png
├── stone_surface_ambient.png
└── stone_surface_specular.png
```

## 📁 프로젝트 구조

```
NormalMap-Online/
├── input/              # 입력 heightmap 이미지들
├── output/             # 생성된 텍스처 파일들
├── batch.js           # 배치 처리 메인 스크립트
├── index.html         # 웹 인터페이스
├── javascripts/       # 웹 앱 JavaScript 파일들
├── package.json       # Node.js 의존성 및 스크립트
└── README.md
```

## ✨ 주요 특징

- 🔄 **자동 배치 처리**: 폴더 내 모든 이미지를 한 번에 처리
- 🎯 **1→4 변환**: 하나의 입력 파일 → 4개의 출력 파일
- 🌐 **웹 기술 활용**: 기존 NormalMap-Online의 모든 기능 사용
- 🤖 **Node.js 자동화**: Puppeteer로 브라우저 환경을 자동 실행
- 📁 **파일 시스템 저장**: 브라우저 다운로드 없이 직접 파일 저장
- 🔧 **CORS 해결**: 내장 HTTP 서버로 보안 제한 우회

## 🔧 작동 원리

1. **로컬 HTTP 서버 시작** (포트 8080)
2. **Puppeteer로 브라우저 자동화**
3. **웹 앱에서 이미지 로딩**
4. **4가지 맵 생성 및 처리**
5. **output 폴더에 직접 저장**

## 📋 상세 로그 예시

```bash
배치 처리 시작...
HTTP 서버 시작됨: http://localhost:8080
페이지 로딩 완료
JavaScript 객체 초기화 완료
1개의 이미지 파일 발견
파일 처리 중: test
이미지 로딩 시작...
맵 생성 완료 대기 중...
맵 상태: { normalCanvas: 'OK', displacementCanvas: 'OK', aoCanvas: 'OK', specularCanvas: 'OK' }
Normal Map 생성 시작...
파일 저장됨: /path/to/output/test_normal.png
Displacement Map 생성 시작...
파일 저장됨: /path/to/output/test_displacement.png
Ambient Occlusion Map 생성 시작...
파일 저장됨: /path/to/output/test_ambient.png
Specular Map 생성 시작...
파일 저장됨: /path/to/output/test_specular.png
test 처리 완료. 생성된 파일: test_normal.png, test_displacement.png, test_ambient.png, test_specular.png
모든 파일 처리 완료
HTTP 서버 종료됨
배치 처리 완료
```

## 🛠 고급 설정

### 생성할 맵 타입 선택

`batch.js` 파일의 `processFile` 메서드에서 원하는 맵만 활성화할 수 있습니다:

```javascript
const includeNormal = true; // 노멀 맵
const includeDisplacement = true; // 디스플레이스먼트 맵
const includeAmbient = true; // 앰비언트 오클루전 맵
const includeSpecular = true; // 스페큘러 맵
```

### 포트 변경

기본 포트 8080이 사용 중일 경우:

```javascript
// batch.js 파일에서 포트 수정
this.port = 3000; // 원하는 포트 번호
```

## 🐛 문제 해결

### 포트 사용 중 오류

```bash
Error: listen EADDRINUSE: address already in use :::8080
```

**해결법**: 다른 포트로 변경하거나 기존 프로세스 종료

### 파일 권한 오류

```bash
Error: EACCES: permission denied
```

**해결법**: output 폴더 권한 확인 또는 관리자 권한으로 실행

### 브라우저 실행 실패

```bash
Error: Failed to launch the browser process
```

**해결법**:

- Chrome/Chromium 브라우저 설치 확인
- `npm install puppeteer` 재실행

### 메모리 부족 (대용량 이미지 처리 시)

**해결법**: Node.js 메모리 제한 증가

```bash
node --max-old-space-size=4096 batch.js
```

## 📝 지원되는 파일 형식

| 형식 | 확장자      | 지원 여부 |
| ---- | ----------- | --------- |
| PNG  | .png        | ✅        |
| JPEG | .jpg, .jpeg | ✅        |
| BMP  | .bmp        | ✅        |
| TIFF | .tiff, .tif | ✅        |
| TGA  | .tga        | ✅        |

## 🎮 웹 인터페이스

배치 처리 외에도 기존 웹 인터페이스를 통한 개별 처리도 가능합니다:

```bash
# HTTP 서버 직접 실행 (개발용)
npx http-server . -p 8080
```

브라우저에서 `http://localhost:8080` 접속

---

**원본 프로젝트**: [NormalMap-Online](https://github.com/cpetry/NormalMap-Online)  
**라이선스**: MIT
