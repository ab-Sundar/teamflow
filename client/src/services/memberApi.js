import api from "./api";

export const getWorkspaceMembers = async (
  workspaceId
) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/members`
  );

  return response.data;
};

export const addWorkspaceMember = async (
  workspaceId,
  memberData
) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/members`,
    memberData
  );

  return response.data;
};

export const updateWorkspaceMemberRole = async (
  workspaceId,
  userId,
  role
) => {
  const response = await api.patch(
    `/workspaces/${workspaceId}/members/${userId}`,
    {
      role,
    }
  );

  return response.data;
};

export const removeWorkspaceMember = async (
  workspaceId,
  userId
) => {
  await api.delete(
    `/workspaces/${workspaceId}/members/${userId}`
  );
};