import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? '/api/v1'
    : 'https://jobify-portal-l9os.onrender.com/api/v1');

const customFetch = axios.create({
  baseURL,
  withCredentials: true,
});

export default customFetch;
