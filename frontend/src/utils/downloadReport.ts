const parseFileName = (cd: string, fallback: string): string => {
  // RFC 5987: filename*=UTF-8''encoded-name (handles non-ASCII characters)
  const rfc5987 = cd.match(/filename\*=UTF-8''([^;]+)/i);
  if (rfc5987) return decodeURIComponent(rfc5987[1]);
  const basic = cd.match(/filename="([^"]+)"/);
  return basic ? basic[1] : fallback;
};

export async function downloadReport(url: string, fallbackFileName: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al generar el archivo: ${res.status}`);

  const cd = res.headers.get('Content-Disposition') ?? '';
  const fileName = parseFileName(cd, fallbackFileName);

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
