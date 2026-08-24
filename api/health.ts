const healthPayload = () => ({
  status: 'ok',
  service: 'DAW-fi Web',
  runtime: 'vercel',
  timestamp: new Date().toISOString(),
});

const healthHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
} as const;

export function GET(): Response {
  return new Response(JSON.stringify(healthPayload()), {
    status: 200,
    headers: healthHeaders,
  });
}

export function HEAD(): Response {
  return new Response(null, {
    status: 200,
    headers: healthHeaders,
  });
}
