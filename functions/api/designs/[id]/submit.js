function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestPost() {
  return jsonResponse(
    {
      ok: false,
      error: "Finished builds can only be submitted from an authorized private project page.",
    },
    410
  );
}
