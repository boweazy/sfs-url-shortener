import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Types
export interface Link {
  id: string;
  shortCode: string;
  destination: string;
  clicks: number;
  created: string;
  qrCodeEnabled: boolean;
  folder?: string;
  title?: string;
}

export interface CreateLinkData {
  url: string;
  customSlug?: string;
  qrCodeEnabled?: boolean;
  password?: string;
  expiresAt?: string;
  folder?: string;
  title?: string;
  description?: string;
}

export interface CreateLinkResponse {
  link: Link & { shortUrl: string };
}

// API Functions
async function fetchLinks(): Promise<Link[]> {
  const response = await fetch("/api/links");
  if (!response.ok) {
    throw new Error("Failed to fetch links");
  }
  const data = await response.json();
  return data.links;
}

async function createLink(data: CreateLinkData): Promise<CreateLinkResponse> {
  const response = await fetch("/api/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create link");
  }

  return response.json();
}

async function deleteLink(id: string): Promise<void> {
  const response = await fetch(`/api/links/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete link");
  }
}

async function fetchLinkAnalytics(id: string) {
  const response = await fetch(`/api/links/${id}/analytics`);
  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }
  return response.json();
}

// React Query Hooks
export function useLinks() {
  return useQuery({
    queryKey: ["links"],
    queryFn: fetchLinks,
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useLinkAnalytics(id: string | null) {
  return useQuery({
    queryKey: ["analytics", id],
    queryFn: () => fetchLinkAnalytics(id!),
    enabled: !!id,
  });
}
