// src/lib/visibility.ts - 数据可见性控制
// 策略：管理员看所有数据；非管理员只看自己创建的 + 内置数据 + 旧数据（owner 为 null）

import { User } from '@prisma/client';

// 管理员角色名（与 DEMO_ACCOUNTS 中一致）
const ADMIN_ROLE = '管理员';

// 判断是否为管理员
export function isAdmin(user: User | null | undefined): boolean {
  return !!user && user.role === ADMIN_ROLE;
}

/**
 * 构建数据可见性 where 条件（有 isBuiltin 字段的模型）
 * @param user 当前用户
 * @param ownerField 所有者字段名（如 'ownerId', 'creatorId', 'assignedBy'）
 * @returns Prisma where 条件
 *
 * 管理员：无限制（返回空对象）
 * 非管理员：自己创建的 OR 内置数据 OR 旧数据（owner 为 null）
 */
export function visibleScope(user: User | null | undefined, ownerField: string): any {
  if (isAdmin(user)) {
    return {}; // 管理员看所有
  }
  // 非管理员：自己创建的 + 内置数据 + 旧数据
  return {
    OR: [
      { [ownerField]: user!.id },
      { [ownerField]: null },
      { isBuiltin: true },
    ],
  };
}

/**
 * 构建数据可见性 where 条件（无 isBuiltin 字段的模型，如 Todo）
 * @param user 当前用户
 * @param ownerField 所有者字段名
 * @returns Prisma where 条件
 *
 * 管理员：无限制
 * 非管理员：只看自己的 + 旧数据（owner 为 null）
 */
export function visibleScopeNoBuiltin(user: User | null | undefined, ownerField: string): any {
  if (isAdmin(user)) {
    return {};
  }
  return {
    OR: [
      { [ownerField]: user!.id },
      { [ownerField]: null },
    ],
  };
}

/**
 * 检查单条资源的读权限（GET 单条详情）
 * @param resource 资源对象（须含 ownerField 字段，可选 isBuiltin）
 * @param user 当前用户
 * @param ownerField 所有者字段名
 * @returns 是否可读
 *
 * 管理员：允许所有
 * 非管理员：自己创建的 + 内置数据 + 旧数据（owner 为 null）
 */
export function canRead(
  resource: any,
  user: User | null | undefined,
  ownerField: string,
): boolean {
  if (isAdmin(user)) return true;
  if (!resource) return false;
  return (
    resource[ownerField] === user!.id ||
    resource[ownerField] === null ||
    resource[ownerField] === undefined ||
    resource.isBuiltin === true
  );
}

/**
 * 检查单条资源的写权限（PUT 编辑 / DELETE 删除）
 * @param resource 资源对象
 * @param user 当前用户
 * @param ownerField 所有者字段名
 * @returns 是否可写
 *
 * 管理员：允许所有
 * 非管理员：仅自己创建的（内置数据和旧数据 owner 为 null 的不可改删）
 */
export function canModify(
  resource: any,
  user: User | null | undefined,
  ownerField: string,
): boolean {
  if (isAdmin(user)) return true;
  if (!resource) return false;
  return resource[ownerField] === user!.id;
}
