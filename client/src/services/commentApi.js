import api from "./api";

export const getComments = async (listId, cardId) => {
  const response = await api.get(
    `/lists/${listId}/cards/${cardId}/comments`
  );

  return response.data;
};

export const createComment = async (
  listId,
  cardId,
  content
) => {
  const response = await api.post(
    `/lists/${listId}/cards/${cardId}/comments`,
    {
      content,
    }
  );

  return response.data;
};

export const deleteComment = async (
  listId,
  cardId,
  commentId
) => {
  const response = await api.delete(
    `/lists/${listId}/cards/${cardId}/comments/${commentId}`
  );

  return response.data;
};