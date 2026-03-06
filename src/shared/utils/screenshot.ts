import html2canvas from 'html2canvas';

export const captureNodeScreenshot = async (node: HTMLElement): Promise<string> => {
  const shot = await html2canvas(node);
  return shot.toDataURL('image/png');
};
