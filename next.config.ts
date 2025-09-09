import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-9d5f1007-5857-47ed-8609-17b53ec4263d.space.z.ai',
    'preview-chat-5f9e2a88-e706-4e7a-aac6-026b04e68b49.space.z.ai',
    'preview-chat-e8447202-de76-4995-b38c-4b0f6f9c67b0.space.z.ai',
    'space.z.ai'
  ],
  webpack: (config, { dev }) => {
    if (dev) {
      // 禁用 webpack 的热模块替换
      config.watchOptions = {
        ignored: ['**/*'], // 忽略所有文件变化
      };
    }
    return config;
  },
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
