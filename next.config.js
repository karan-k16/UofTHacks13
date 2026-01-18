/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle audio worklet files
    config.module.rules.push({
      test: /\.worklet\.(js|ts)$/,
      use: { loader: 'worklet-loader' },
    });
    
    // Completely exclude tone.js from server-side processing
    if (isServer) {
      // Add tone to externals to prevent bundling
      const externals = config.externals || [];
      config.externals = [
        ...( Array.isArray(externals) ? externals : [externals]),
        'tone',
      ];
      
      // Also add alias as backup
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['tone'] = false;
    }
    
    return config;
  },
  // Enable experimental features for better audio handling
  experimental: {
    serverComponentsExternalPackages: ['tone'],
  },
};

module.exports = nextConfig;

