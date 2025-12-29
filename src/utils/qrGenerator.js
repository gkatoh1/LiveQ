export const downloadStyledQr = async (slug, name) => {
  // 1. Setup Canvas (High Resolution for Printing)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 1080;
  const height = 1920; // 9:16 Portrait
  canvas.width = width;
  canvas.height = height;

  // 2. Background (WHITE)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Helper function to load images
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  try {
    // --- DRAW LOGO ---
    // We assume /logo.png exists in your public folder
    const logo = await loadImage('/logo.png');
    // Calculate aspect ratio to keep logo looking good
    const logoWidth = 400; 
    const logoHeight = (logo.naturalHeight / logo.naturalWidth) * logoWidth;
    ctx.drawImage(logo, (width - logoWidth) / 2, 100, logoWidth, logoHeight);

  } catch (e) {
    console.warn("Logo load failed, skipping", e);
  }

  // --- TEXT CONFIG ---
  ctx.textAlign = 'center';

  // 3. Header "イベントに参加" (Black)
  ctx.fillStyle = '#000000';
  ctx.font = '900 80px sans-serif'; 
  ctx.fillText('イベントに参加', width / 2, 400);

  // 4. Event Name (BIGGER & BOLD)
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 110px sans-serif'; // Increased size
  // Text wrap logic if name is too long
  const maxNameWidth = 900;
  if (ctx.measureText(name).width > maxNameWidth) {
      ctx.font = 'bold 70px sans-serif'; // Shrink if too long
  }
  ctx.fillText(name, width / 2, 550);

  // 5. QR Code
  // Using api.qrserver.com to get the raw QR image
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(window.location.origin + '/' + slug)}`;
  
  try {
    const qrImg = await loadImage(qrUrl);
    
    // Draw QR centered
    const qrSize = 800;
    const qrX = (width - qrSize) / 2;
    const qrY = (height - qrSize) / 2 + 100; // Shifted down a bit
    
    // Draw a subtle border for the QR
    ctx.strokeStyle = "#E5E7EB"; // Light gray
    ctx.lineWidth = 4;
    ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  } catch (e) {
    alert("QRコードの生成に失敗しました: " + e.message);
    return;
  }

  // 7. URL Text (Indigo/Blue)
  const displayUrl = `${window.location.host}/${slug}`;
  ctx.fillStyle = '#4F46E5'; // Indigo color
  ctx.font = 'bold 60px monospace';
  ctx.fillText(displayUrl, width / 2, 1650);

  // 8. Footer Instructions (Japanese)
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('スマホのカメラでスキャンしてください', width / 2, 1750);

  // 9. Trigger Download
  const link = document.createElement('a');
  link.download = `liveq-event-${slug}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};