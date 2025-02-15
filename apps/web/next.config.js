/** @type {import('next').NextConfig} */
const nextConfig = {
  // Other configurations...
  typescript: {
    // WARNING: This allows production builds to succeed even if there are type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
