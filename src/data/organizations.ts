import { useEffect, useState } from "react";
import { readScoped, writeScoped } from "@/lib/scoped-storage";

export const ORGANIZATION_ITEM_TYPES = ["Tautan", "Tugas", "Rutinitas harian", "Rutinitas mingguan", "Rapat rutin", "SOP", "Lainnya"] as const;
export type OrganizationItemType = (typeof ORGANIZATION_ITEM_TYPES)[number];

export type OrganizationItem = {
  id: number;
  type: OrganizationItemType;
  title: string;
  description: string;
  url?: string;
  day?: string;
  start?: string;
  end?: string;
  room?: string;
  done?: boolean;
};

export type Organization = {
  id: number;
  name: string;
  role: string;
  items: OrganizationItem[];
};

const STORAGE_KEY = "my-room.organizations.v1";

/** Optional organization workspace stored separately for each signed-in account. */
export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    setOrganizations(readScoped<Organization[]>(STORAGE_KEY) ?? []);
  }, []);

  const save = (next: Organization[]) => {
    setOrganizations(next);
    writeScoped(STORAGE_KEY, next);
  };

  return {
    organizations,
    addOrganization: (name: string, role: string) => {
      const organization: Organization = { id: Date.now(), name: name.trim(), role: role.trim(), items: [] };
      save([...organizations, organization]);
      return organization.id;
    },
    removeOrganization: (id: number) => save(organizations.filter((item) => item.id !== id)),
    addItem: (organizationId: number, item: Omit<OrganizationItem, "id">) =>
      save(organizations.map((organization) => organization.id === organizationId
        ? { ...organization, items: [{ ...item, id: Date.now() }, ...organization.items] }
        : organization)),
    removeItem: (organizationId: number, itemId: number) =>
      save(organizations.map((organization) => organization.id === organizationId
        ? { ...organization, items: organization.items.filter((item) => item.id !== itemId) }
        : organization)),
    toggleItem: (organizationId: number, itemId: number) =>
      save(organizations.map((organization) => organization.id === organizationId
        ? { ...organization, items: organization.items.map((item) => item.id === itemId ? { ...item, done: !item.done } : item) }
        : organization)),
  };
}