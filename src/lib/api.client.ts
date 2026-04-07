import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import type { paths } from "./api.schema";
import { getAccessToken } from "@/store/auth.store";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const fetchClient = createFetchClient<paths>({
  baseUrl: apiBaseUrl,
  fetch: async (request) => {
    const token = getAccessToken();
    if (!token) return fetch(request);

    const headers = new Headers(request.headers);

    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(new Request(request, { headers }));
  },
});

const $api = createClient(fetchClient);

export default $api;