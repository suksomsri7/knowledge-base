export const PERMISSIONS = {
  "kb:read": "Read articles",
  "kb:create": "Create articles",
  "kb:edit": "Edit any article",
  "kb:edit_own": "Edit own articles",
  "kb:delete": "Delete articles",
  "kb:publish": "Publish / unpublish articles",
  "category:manage": "Manage categories",
  "member:view": "View members",
  "member:manage": "Manage members & roles",
  "brand:settings": "Manage brand settings",
  "chat:respond": "Respond to chats",
  "chat:view_all": "View all chat sessions",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const DEFAULT_ROLES = {
  "Brand Admin": ALL_PERMISSIONS,
  Editor: [
    "kb:read",
    "kb:create",
    "kb:edit",
    "kb:publish",
    "category:manage",
    "member:view",
  ] as Permission[],
  Writer: ["kb:read", "kb:create", "kb:edit_own"] as Permission[],
  Viewer: ["kb:read"] as Permission[],
};

export function hasPermission(
  userPermissions: string[],
  required: Permission | Permission[]
): boolean {
  const requiredPerms = Array.isArray(required) ? required : [required];
  return requiredPerms.every((p) => userPermissions.includes(p));
}

export function hasAnyPermission(
  userPermissions: string[],
  required: Permission[]
): boolean {
  return required.some((p) => userPermissions.includes(p));
}
