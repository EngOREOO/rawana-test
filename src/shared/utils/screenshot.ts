import html2canvas from 'html2canvas';

export const captureNodeScreenshot = async (node: HTMLElement): Promise<string> => {
  const shot = await html2canvas(node, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    scale: window.devicePixelRatio > 1 ? 2 : 1,
    imageTimeout: 15000,
    onclone: (doc) => {
      doc.querySelectorAll('img').forEach((img) => {
        img.setAttribute('crossorigin', 'anonymous');
      });
    },
  });
  return shot.toDataURL('image/png');
};
