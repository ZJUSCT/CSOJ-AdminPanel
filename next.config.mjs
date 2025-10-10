/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Since the admin panel is served by the same backend,
  // API requests to /api/... will be correctly routed without rewrites.
  // This configuration is optimized for `go run` or a single binary deployment.
};

export default nextConfig;