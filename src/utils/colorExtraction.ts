// Color extraction utility
export const extractVibrantColor = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx?.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData?.data;
        
        if (!data) {
          resolve('#1f2937'); // fallback gray
          return;
        }
        
        const colorMap: { [key: string]: number } = {};
        
        // Define center region (30% radius from center)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        
        // Sample only from center region
        for (let y = Math.max(0, Math.floor(centerY - radius)); y < Math.min(canvas.height, Math.ceil(centerY + radius)); y++) {
          for (let x = Math.max(0, Math.floor(centerX - radius)); x < Math.min(canvas.width, Math.ceil(centerX + radius)); x++) {
            // Check if pixel is within circular radius
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            if (distance > radius) continue;
            
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent or very dark pixels
            if (a < 128 || (r + g + b) < 100) continue;
          
          // Calculate vibrance (saturation + brightness)
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const brightness = max / 255;
          const vibrance = saturation * brightness;
          
          // Only consider vibrant colors and avoid white/light colors
          if (vibrance > 0.3 && (r + g + b) < 600) { // Avoid very light colors
            const color = `rgb(${r},${g},${b})`;
            colorMap[color] = (colorMap[color] || 0) + vibrance;
          }
          }
        }
        
        // Find the LEAST dominant vibrant color (gemstones vs backgrounds)
        let bestColor = '#1f2937';
        let bestScore = Infinity; // Look for minimum score instead
        
        // Only consider colors that appear with reasonable frequency
        const minThreshold = Math.max(...Object.values(colorMap)) * 0.1;
        
        for (const [color, score] of Object.entries(colorMap)) {
          if (score > minThreshold && score < bestScore) {
            bestScore = score;
            bestColor = color;
          }
        }
        
        // Fallback to most vibrant if no suitable least dominant found
        if (bestColor === '#1f2937') {
          bestScore = 0;
          for (const [color, score] of Object.entries(colorMap)) {
            if (score > bestScore) {
              bestScore = score;
              bestColor = color;
            }
          }
        }
        
        resolve(bestColor);
      } catch {
        resolve('#1f2937'); // fallback
      }
    };
    
    img.onerror = () => resolve('#1f2937');
    img.src = imageSrc;
  });
};