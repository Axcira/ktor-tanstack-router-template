import { canI } from "@/api/generated/default/default.ts";
import type { Permission, UserSession } from "@/api/generated/schemas";

type StaticPermission = {
  [K in Permission["type"]]: Extract<Permission, { type: K }> extends {
    type: K;
  } & infer Rest
    ? keyof Rest extends never
      ? Extract<Permission, { type: K }>
      : never
    : never;
}[Permission["type"]];

function isStaticPermission(
  permission: Permission,
): permission is StaticPermission {
  return Object.keys(permission).length === 1;
}

export async function checkPermission(
  session: UserSession,
  permission: Permission,
): Promise<boolean> {
  if (isStaticPermission(permission)) {
    if (session.permissions.some((p) => p.type === permission.type)) {
      // static permissions can be checked locally
      return true;
    }
    // some permissions (ManageArticle etc.) are compound of some Articles-related permissions,
    // so we can't return here. We still need to fetch the server about permission and authorize
  }

  try {
    const canIResponse = await canI(permission);
    console.log("canIResponse", canIResponse);
    return canIResponse.status === 200;
  } catch (error) {
    console.error("Permission check failed", error);
    return false;
  }
}
export type TsToRuntimeType<T> = T extends boolean
  ? "boolean"
  : T extends string
    ? "string"
    : T extends number
      ? "number"
      : "unknown";

export type UI_Requirement<T extends { type: string }> = {
  [P in T as P["type"]]: {
    label: string;
    description: string;
    props: keyof Omit<P, "type"> extends never
      ? Record<string, never>
      : {
          [K in keyof Omit<P, "type">]: {
            label: string;
            type: TsToRuntimeType<P[K]>;
          };
        };
  };
};

export const PERMISSION_UI_DEFS = {
  Administrator: {
    label: "管理者権限",
    description:
      "管理者権限は、全ての権限チェックを無効化します。注意して使用してください。",
    props: {},
  },
  DeleteArticle: {
    label: "記事の削除",
    description: "記事を削除する権限を与えます。",
    props: {
      allowOthers: {
        label: "有効にすると、他人の記事も削除できます。",
        type: "boolean",
      },
    },
  },
  CreateArticle: {
    label: "記事の作成",
    description: "記事を作成する権限を与えます。",
    props: {},
  },
  ManageArticles: {
    label: "記事の管理",
    description:
      "記事の作成、編集、削除などの管理権限を与えます。これを有効にすると、記事管理に関する他の権限も有効とみなされます。",
    props: {},
  },
  ManageUsers: {
    label: "ユーザーの管理",
    description: "ユーザーの作成、編集、削除などの管理権限を与えます。",
    props: {},
  },
  UpdateArticle: {
    label: "記事の更新と編集",
    description: "記事を更新または編集する権限を与えます。",
    props: {
      allowOthers: {
        label: "有効にすると、他人の記事も編集できます。",
        type: "boolean",
      },
    },
  },
} satisfies UI_Requirement<Permission>;
