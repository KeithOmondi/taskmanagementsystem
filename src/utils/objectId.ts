import { Types } from "mongoose";

export const hasObjectId = (
  list: readonly Types.ObjectId[] | undefined,
  id: Types.ObjectId,
): boolean => {
  if (!list) return false;
  return list.some((item: Types.ObjectId) => item.equals(id));
};
