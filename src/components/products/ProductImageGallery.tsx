"use client";

import { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  name: string;
}

export default function ProductImageGallery({
  images,
  name,
}: ProductImageGalleryProps) {
  const validImages =
    images.length > 0
      ? images
      : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"];
  const [selectedImage, setSelectedImage] = useState(validImages[0]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Display */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 shadow-xs">
        <img
          src={selectedImage}
          alt={name}
          className="h-full w-full object-cover object-center transition-all duration-300"
        />
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {validImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                selectedImage === img
                  ? "border-gray-900 shadow-xs"
                  : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-200"
              }`}
            >
              <img
                src={img}
                alt={`${name} thumbnail ${index + 1}`}
                className="h-full w-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
