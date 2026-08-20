/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve images directly instead of routing through the /_next/image
    // optimization endpoint. That endpoint depends on the optional `sharp`
    // binary and can fail (showing broken image icons) in sandboxed/preview
    // hosting environments or when sharp isn't installed. Since this is a
    // frontend prototype, we don't need on-the-fly resizing/optimization.
    unoptimized: true,
  },
}

module.exports = nextConfig
