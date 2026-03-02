export const generateFileName = (
  prefix: string,
  extension: string = 'csv',
  includeTime: boolean = true
): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const cleanPrefix = prefix.replace(/\s+/g, '_').toLowerCase();
  return includeTime
    ? `${cleanPrefix}_${date}_${time}.${extension}`
    : `${cleanPrefix}_${date}.${extension}`;
};

export const downloadFile = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};
