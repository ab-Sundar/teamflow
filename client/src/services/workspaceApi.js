import api from "./api";

export const createWorkspace = async (workspaceData) => {
  const response = await api.post("/workspaces", workspaceData);

  return response.data;
};

export const getUserWorkspaces = async () => {
  const response = await api.get("/workspaces");

  return response.data;
};

export const getWorkspaceById = async (workspaceId) => {
  const response = await api.get(`/workspaces/${workspaceId}`);

  return response.data;
};