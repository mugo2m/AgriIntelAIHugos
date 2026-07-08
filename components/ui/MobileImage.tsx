// components/ui/MobileImage.tsx
'use client';

import Image, { ImageProps } from 'next/image';
import { useMobile } from '@/lib/hooks/useMobile';

interface MobileImageProps extends ImageProps {
  mobileWidth?: number;
  mobileHeight?: number;
  mobilePriority?: boolean;
}

export const MobileImage = ({
  src,
  alt,
  width,
  height,
  mobileWidth,
  mobileHeight,
  mobilePriority = false,
  className = '',
  ...props
}: MobileImageProps) => {
  const { isMobile } = useMobile();

  // Use mobile-specific dimensions if provided
  const finalWidth = isMobile && mobileWidth ? mobileWidth : width;
  const finalHeight = isMobile && mobileHeight ? mobileHeight : height;

  // Prioritize loading on mobile for LCP images
  const priority = isMobile && mobilePriority ? true : props.priority;

  return (
    <Image
      src={src}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      className={className}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
};