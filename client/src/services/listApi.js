import api from "./api";

export const getLists = async (boardId) => {
  const response = await api.get(
    `/boards/${boardId}/lists`
  );

  return response.data;
};

export const getList = async (boardId, listId) => {
  const response = await api.get(
    `/boards/${boardId}/lists/${listId}`
  );

  return response.data;
};

export const createList = async (boardId, listData) => {
  const response = await api.post(
    `/boards/${boardId}/lists`,
    listData
  );

  return response.data;
};

export const updateList = async (
  boardId,
  listId,
  listData
) => {
  const response = await api.patch(
    `/boards/${boardId}/lists/${listId}`,
    listData
  );

  return response.data;
};

export const deleteList = async (boardId, listId) => {
  const response = await api.delete(
    `/boards/${boardId}/lists/${listId}`
  );

  return response.data;
};