import axios from "axios";

const api = axios.create({
  baseURL:"https:data-production-88c4.up.railway.app",
 //"http://localhost:5000/api",
});

export default api;
