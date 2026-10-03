# Farm Diet

Farm Diet의 개발 소스는 `farm-diet/`에 있습니다. 저장소 최상위의 기존 HTML·정적 자산은 최초 Netlify 업로드 파일로 보존합니다. 자동 배포에는 `farm-diet/out/`에서 새로 빌드한 결과만 사용합니다.

## 개발

Node.js 22 환경에서 실행합니다.

```sh
cd farm-diet
npm ci
npm run dev
```

## 확인 및 배포

```sh
cd farm-diet
npm test
npm run build
```

GitHub의 `main`에 push하면 연결된 Netlify 프로젝트가 루트의 `netlify.toml` 설정에 따라 테스트와 빌드를 실행합니다. 성공한 `farm-diet/out/`만 게시합니다. Netlify의 production branch는 `main`이어야 합니다.

```sh
git add farm-diet netlify.toml README.md .gitignore
git commit -m "Update Farm Diet"
git push origin main
```

`git add`는 저장소 최상위에서 실행합니다. 원본 Excel·환경변수 파일·의존성·빌드 캐시는 GitHub에 올리지 않습니다. 배포는 `src/data/benchmark-2024.json`을 사용하며 Excel 재전처리를 하지 않습니다.

데이터를 변경하려면 원본을 로컬 `farm-diet/data/raw/`에 준비한 뒤 `npm run data:build`를 실행하고 생성된 JSON 변경을 commit합니다. 자세한 데이터 처리와 한계는 `farm-diet/README.md`, `farm-diet/VALIDATION.md`에 있습니다.
