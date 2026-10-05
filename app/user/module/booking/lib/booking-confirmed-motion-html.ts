/** Inline page so WebView plays SMIL / motion inside the hosted SVG. */
export function bookingConfirmedMotionHtml(svgUri: string): string {
  const safeUri = svgUri.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  object {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
</style>
</head>
<body>
  <object type="image/svg+xml" data="${safeUri}" aria-label="Booking confirmed"></object>
</body>
</html>`;
}
