/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react', 'recharts'],
  },
  compiler: {
    removeConsole: true,
  },
  webpack: (config, { dev }) => {
    // Desactivar source maps en producción para mejorar velocidad
    if (!dev) {
      config.devtool = false;
    }
    
    return config;
  },
};

module.exports = nextConfig;
