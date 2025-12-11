interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  // For external images (like YouTube thumbnails) - applies additional optimizations
  isExternal?: boolean;
  // Disable WebP if needed (WebP is enabled by default for local images)
  disableWebP?: boolean;
  // Generate srcset for responsive images (useful for YouTube thumbnails)
  // If true, will generate srcset with different sizes
  responsive?: boolean;
}

/**
 * Optimized Image component with WebP support and performance optimizations
 * 
 * Features:
 * - Automatic WebP format with PNG/JPG fallback (for local images)
 * - Proper width/height attributes to prevent layout shift
 * - Async decoding for non-blocking image loading
 * - Lazy loading support
 * - Fetch priority hints
 * - External image optimization
 * 
 * Usage:
 * <OptimizedImage 
 *   src="/image.png" 
 *   alt="Description"
 *   width={80}
 *   height={80}
 *   loading="lazy"
 * />
 * 
 * Note: WebP versions should be placed alongside PNG files (e.g., image.png and image.webp)
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  decoding = 'async',
  isExternal = false,
  disableWebP = false,
  responsive = false,
  ...props
}: OptimizedImageProps) {
  // Determine the best image source
  let imageSrc = src;
  
  // For local images, automatically use WebP with fallback (unless disabled)
  if (!isExternal && !disableWebP) {
    // Generate WebP source path
    const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    // Use picture element for WebP with fallback
    // Modern browsers will use WebP from source, older browsers will use PNG from img
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          {...props}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding={decoding}
        />
      </picture>
    );
  }

  // For external images (YouTube thumbnails), optimize loading
  if (isExternal) {
    // Generate srcset for YouTube thumbnails if responsive is enabled
    // YouTube provides different thumbnail sizes: default, mqdefault, hqdefault, sddefault, maxresdefault
    let srcSet: string | undefined;
    if (responsive && imageSrc.includes('ytimg.com') || imageSrc.includes('youtube.com')) {
      // Extract the base URL and generate srcset with different YouTube thumbnail sizes
      const baseUrl = imageSrc.replace(/\/(default|mqdefault|hqdefault|sddefault|maxresdefault)\.jpg/i, '');
      srcSet = [
        `${baseUrl}/default.jpg 120w`,
        `${baseUrl}/mqdefault.jpg 320w`,
        `${baseUrl}/hqdefault.jpg 480w`,
        `${baseUrl}/sddefault.jpg 640w`
      ].join(', ');
    }
    
    return (
      <img
        {...props}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        srcSet={srcSet}
        sizes={responsive ? '(max-width: 640px) 320px, (max-width: 1024px) 480px, 640px' : undefined}
        // Add referrerpolicy for external images
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  // Standard optimized image
  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
    />
  );
}
