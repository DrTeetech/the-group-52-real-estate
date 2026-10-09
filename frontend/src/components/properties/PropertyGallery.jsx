import { useState } from 'react';

const fallbackImage = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80';

export default function PropertyGallery({ property }) {
  const images = property.images?.length ? property.images : [property.image || fallbackImage];
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="property-gallery">
      <img className="property-gallery-main" src={images[selectedIndex] || fallbackImage} alt={property.name} />
      {images.length > 1 && (
        <div className="property-gallery-thumbnails" aria-label="Property images">
          {images.map((image, index) => (
            <button
              type="button"
              className={selectedIndex === index ? 'is-selected' : ''}
              key={`${image}-${index}`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show property image ${index + 1}`}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
