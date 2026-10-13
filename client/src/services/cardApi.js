import api from "./api";

export const getCards = async (listId) => {
  const response = await api.get(
    `/lists/${listId}/cards`
  );

  return response.data;
};

export const getCard = async (listId, cardId) => {
  const response = await api.get(
    `/lists/${listId}/cards/${cardId}`
  );

  return response.data;
};

export const createCard = async (listId, cardData) => {
  const response = await api.post(
    `/lists/${listId}/cards`,
    cardData
  );

  return response.data;
};

export const updateCard = async (
  listId,
  cardId,
  cardData
) => {
  const response = await api.patch(
    `/lists/${listId}/cards/${cardId}`,
    cardData
  );

  return response.data;
};

export const deleteCard = async (listId, cardId) => {
  const response = await api.delete(
    `/lists/${listId}/cards/${cardId}`
  );

  return response.data;
};

export const moveCard = async (
  listId,
  cardId,
  moveData
) => {
  const response = await api.patch(
    `/lists/${listId}/cards/${cardId}/move`,
    moveData
  );

  return response.data;
};

export const assignCard = async (
  listId,
  cardId,
  userId
) => {
  const response = await api.patch(
    `/lists/${listId}/cards/${cardId}/assignee`,
    {
      userId,
    }
  );

  return response.data;
};

export const updateCardDueDate = async (
  listId,
  cardId,
  dueDate
) => {
  const response = await api.patch(
    `/lists/${listId}/cards/${cardId}/due-date`,
    {
      dueDate,
    }
  );

  return response.data;
};