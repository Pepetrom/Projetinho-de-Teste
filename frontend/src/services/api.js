import axios from 'axios';

const API_URL = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';

export const login = async (username) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username });
    return response.data;
  } catch (error) {
    console.error('Login error', error);
    throw error;
  }
};

export const getLeaderboard = async () => {
  try {
    const response = await axios.get(`${API_URL}/leaderboard`);
    return response.data;
  } catch (error) {
    console.error('Leaderboard error', error);
    throw error;
  }
};
