import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 100,
  duration: "1m",
};

const BASE = "https://chemosense-backend.onrender.com";

export default function () {
  const loginRes = http.post(
    `${BASE}/api/login`,
    JSON.stringify({ student_id: "demo", password: "demo123" }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(loginRes, { "login status 200": (r) => r.status === 200 });
  const token = loginRes.json("token");

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
  const dashRes = http.get(`${BASE}/api/dashboard`, authHeaders);
  check(dashRes, { "dashboard status 200": (r) => r.status === 200 });

  const scansRes = http.get(`${BASE}/api/scans`, authHeaders);
  check(scansRes, { "scans status 200": (r) => r.status === 200 });

  sleep(1);
}
