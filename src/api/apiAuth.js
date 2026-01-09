import axios from "axios";

export const loginApi = async (email, password) => {
  try {
    const response = await axios.post(
      "/login",
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

   const userId = response.data.user_id; // ✅ correct

    localStorage.setItem("userId", userId);
    localStorage.setItem("userData", JSON.stringify(response.data));

    return userId;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || error.response.data || "Login failed"
      );
    } else {
      throw new Error(error.message || "Network error");
    }
  }
};
