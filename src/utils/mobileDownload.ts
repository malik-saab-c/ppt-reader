/**
 * Mobile and Desktop file download utility.
 * Triggers native browser download manager which directs files straight into
 * the device's native Download folder (/storage/emulated/0/Download on Android).
 */

export function downloadBlobToDevice(
  blob: Blob,
  fileName: string
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function savePresentationToDownloads(
  pptxBlob: Blob,
  title: string
): Promise<{ success: boolean; pathName: string }> {
  const safeName = (title || 'presentation')
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_');
  const fileName = `${safeName}.pptx`;

  // Check if File System Access API is supported (Chrome Android / Desktop)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'PowerPoint Presentation (.pptx)',
            accept: {
              'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
            }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(pptxBlob);
      await writable.close();
      return { success: true, pathName: fileName };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, pathName: 'Cancelled by user' };
      }
      // Fall through to standard download anchor
    }
  }

  // Standard direct download to mobile / desktop Downloads folder
  downloadBlobToDevice(pptxBlob, fileName);
  return { success: true, pathName: `Downloads/${fileName}` };
}
