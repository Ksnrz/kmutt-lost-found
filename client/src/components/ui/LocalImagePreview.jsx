import { useEffect, useRef } from 'react';

export default function LocalImagePreview({ file, ...imageProps }) {
  const imageRef = useRef(null);

  useEffect(() => {
    const image = imageRef.current;
    const url = URL.createObjectURL(file);
    image.src = url;

    return () => {
      image.removeAttribute('src');
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return <img {...imageProps} ref={imageRef} />;
}
