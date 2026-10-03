export const notificationQueryKeys = {
  all: ['vendor-notifications'] as const,
  list: () => [...notificationQueryKeys.all, 'list'] as const,
};
