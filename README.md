# NormalMap-Online 배치 처리기

하나의 heightmap → 4개의 텍스처 맵 자동 생성

## 🚀 실행

```bash
# 설치
npm install

# input 폴더에 이미지 넣고
npm start

# output 폴더에서 결과 확인
```

## 📁 결과

하나의 `image.jpg` → 4개 파일 생성:

- `image_normal.png` (노멀 맵)
- `image_displacement.png` (디스플레이스먼트 맵)
- `image_ambient.png` (앰비언트 오클루전 맵)
- `image_specular.png` (스페큘러 맵)

**지원 형식**: PNG, JPG, JPEG, BMP, TIFF, TGA

끝.
