import api from "./api";

export const getBoards = async (workspaceId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/boards`
  );

  return response.data;
};

export const getBoard = async (workspaceId, boardId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/boards/${boardId}`
  );

  return response.data;
};

export const createBoard = async (workspaceId, boardData) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/boards`,
    boardData
  );

  return response.data;
};

export const updateBoard = async (
  workspaceId,
  boardId,
  boardData
) => {
  const response = await api.patch(
    `/workspaces/${workspaceId}/boards/${boardId}`,
    boardData
  );

  return response.data;
};

export const deleteBoard = async (workspaceId, boardId) => {
  const response = await api.delete(
    `/workspaces/${workspaceId}/boards/${boardId}`
  );

  return response.data;
};