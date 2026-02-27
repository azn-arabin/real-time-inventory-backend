import { Model, ModelStatic, FindOptions, WhereOptions } from "sequelize";

interface PaginateOptions {
  page?: number | string;
  pageSize?: number | string;
  where?: WhereOptions;
  include?: FindOptions["include"];
  order?: FindOptions["order"];
  attributes?: FindOptions["attributes"];
}

interface PaginateResult<T> {
  items: T[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export const paginate = async <T extends Model>(
  model: ModelStatic<T>,
  options: PaginateOptions = {}
): Promise<PaginateResult<T>> => {
  const page = Number(options.page) || 1;
  const pageSize = Number(options.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const { count, rows } = await model.findAndCountAll({
    where: options.where,
    include: options.include,
    order: options.order || [["createdAt", "DESC"]],
    attributes: options.attributes,
    limit: pageSize,
    offset,
  });

  return {
    items: rows,
    meta: {
      totalItems: count as number,
      totalPages: Math.ceil((count as number) / pageSize),
      currentPage: page,
      pageSize,
    },
  };
};
