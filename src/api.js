import axios from "axios";

const api = axios.create({
  baseURL: "https://data-production-68c6.up.railway.app/api",
  //"http://localhost:5000/api",
});

export default api;
