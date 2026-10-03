import {
  acceptVendorJob,
  completeVendorJob,
  declineVendorJob,
  getVendorJob,
  listVendorJobs,
  markVendorJobEnRoute,
  markVendorJobOnSite,
  sendVendorDeliveryCode,
} from '@/api/jobs.api';
import type { JobFilter, VendorJobDetail, VendorJobSummary } from '@/module/bookings/lib/booking.types';
import { walletKeys } from '@/module/payouts/hooks/use-wallet';
import { useAuthStore } from '@/store/auth.store';
import { useEnRouteTripStore } from '@/store/en-route-trip.store';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InteractionManager } from 'react-native';

function endEnRouteTripIfActive(orderId: string) {
  const active = useEnRouteTripStore.getState().activeOrderId;
  if (active === orderId) {
    void useEnRouteTripStore.getState().endTrip();
  }
}

function beginEnRouteTripIfFieldWorker(orderId: string) {
  const user = useAuthStore.getState().user;
  const mode = usePartnerModeStore.getState().mode;
  if (!selectIsFieldShell(mode, user)) return;
  void useEnRouteTripStore.getState().beginTrip(orderId).then(() => {
    InteractionManager.runAfterInteractions(() => {
      void useEnRouteTripStore.getState().ensureBackgroundSharing();
    });
  });
}

export const vendorJobsKeys = {
  all: ['vendor-jobs'] as const,
  list: (filter?: JobFilter) => [...vendorJobsKeys.all, 'list', filter ?? 'all'] as const,
  detail: (orderId: string) => [...vendorJobsKeys.all, 'detail', orderId] as const,
};

export function useVendorJobs(filter?: JobFilter) {
  return useQuery({
    queryKey: vendorJobsKeys.list(filter),
    queryFn: () => listVendorJobs({ filter, limit: 50 }),
  });
}

export function useVendorJob(orderId: string) {
  return useQuery({
    queryKey: vendorJobsKeys.detail(orderId),
    queryFn: () => getVendorJob(orderId),
    enabled: Boolean(orderId),
  });
}

export function useAcceptVendorJob(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => acceptVendorJob(orderId),
    onSuccess: (data) => {
      queryClient.setQueryData(vendorJobsKeys.detail(orderId), data);
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.all });
    },
  });
}

export function useDeclineVendorJob(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => declineVendorJob(orderId),
    onSuccess: () => {
      endEnRouteTripIfActive(orderId);
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.all });
    },
  });
}

function useTripMutation(orderId: string, mutationFn: () => Promise<VendorJobDetail>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      queryClient.setQueryData(vendorJobsKeys.detail(orderId), data);
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.all });
    },
  });
}

export function useMarkEnRoute(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markVendorJobEnRoute(orderId),
    onSuccess: (data) => {
      queryClient.setQueryData(vendorJobsKeys.detail(orderId), data);
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.all });
      beginEnRouteTripIfFieldWorker(orderId);
    },
  });
}

export function useMarkOnSite(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markVendorJobOnSite(orderId),
    onSuccess: (data) => {
      queryClient.setQueryData(vendorJobsKeys.detail(orderId), data);
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.all });
      endEnRouteTripIfActive(orderId);
    },
  });
}

export function useSendDeliveryCode(orderId: string) {
  return useTripMutation(orderId, () => sendVendorDeliveryCode(orderId));
}

export function useCompleteVendorJob(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => completeVendorJob(orderId, code),
    onSuccess: (data) => {
      queryClient.setQueryData(vendorJobsKeys.detail(orderId), data);
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.all });
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
      endEnRouteTripIfActive(orderId);
    },
  });
}

export function getTodayBookings(bookings: VendorJobSummary[]) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return bookings.filter((booking) => {
    const slot = new Date(booking.scheduledAt);
    return slot >= start && slot < end && booking.status !== 'COMPLETED';
  });
}

export function getUpcomingBookings(bookings: VendorJobSummary[]) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  return bookings.filter((booking) => {
    const slot = new Date(booking.scheduledAt);
    return slot >= end && booking.status !== 'COMPLETED';
  });
}

export function getCompletedBookings(bookings: VendorJobSummary[]) {
  return bookings.filter((booking) => booking.status === 'COMPLETED');
}

export function getPendingActionBookings(bookings: VendorJobSummary[]) {
  return bookings.filter((booking) => booking.needsAction);
}

export function getNextBooking(bookings: VendorJobSummary[]) {
  const today = getTodayBookings(bookings);
  if (today.length > 0) return today[0];
  const upcoming = getUpcomingBookings(bookings);
  return upcoming[0] ?? null;
}
