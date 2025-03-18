import { defineConfig } from 'vite';

export default defineConfig({
  // 루트 디렉토리 설정
  root: 'public',

  // 빌드 설정
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },

  // 서버 설정
  server: {
    port: 3000,
    proxy: {
      // API 요청을 서버로 프록시
      '/api': {
        target: 'http://localhost:8888/.netlify/functions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}); 