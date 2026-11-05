import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

api.defaults.adapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 140));
  let payload = config.data;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = config.data;
    }
  }
  return {
    data: {
      ok: true,
      url: config.url,
      method: config.method,
      payload,
      at: new Date().toISOString(),
    },
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    config,
  };
};

export async function request(method, url, data) {
  const response = await api.request({ method, url, data });
  return response.data;
}

export async function syncWorkspace(snapshot) {
  return request("post", "/workspace/sync", snapshot);
}

export default api;
