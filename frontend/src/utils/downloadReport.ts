export async function downloadReport(url: string, fallbackFileName: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al generar el archivo: ${res.status}`);

  const cd = res.headers.get('Content-Disposition') ?? '';
  const match = cd.match(/filename="([^"]+)"/);
  const fileName = match ? match[1] : fallbackFileName;

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
