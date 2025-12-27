
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // 综合考虑多种可能的变量名
  const finalApiKey = env.API_KEY || env.GEMINI_API_KEY || (process as any).env.API_KEY;

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000
    },
    define: {
      // 这里的定义是解决“缺少密钥”报错的核心
      'process.env.API_KEY': JSON.stringify(finalApiKey)
    }
  };
});
