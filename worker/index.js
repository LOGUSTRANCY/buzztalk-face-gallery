export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only allow POST /match
    if (url.pathname !== "/match" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    // Forward selfie to Render securely
    const formData = await request.formData();

    const resp = await fetch(env.AI_SERVER + "/match", {
      method: "POST",
      headers: {
        "X-School-Key": env.SCHOOL_KEY
      },
      body: formData
    });

    // Pass response back to student
    return new Response(await resp.text(), {
      status: resp.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
