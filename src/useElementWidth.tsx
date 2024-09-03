import { useState, useEffect, useRef } from 'react';

export const useElementWidth = <T extends HTMLElement>() : [a: React.LegacyRef<T>, b: number] => {
  const [width, setWidth] = useState(0);
  const ref = useRef<T>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (ref.current) {
        setWidth(ref.current.offsetWidth);
      }
    };

    updateWidth(); // Initial width
    window.addEventListener('resize', updateWidth);

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return [ref, width];
}
