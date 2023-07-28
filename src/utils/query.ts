import { createConnection } from "mysql";
import { DefaultQueryResult, QueryResult } from "../typings/database";

const database = createConnection({
  host: process.env.db_h,
  password: process.env.db_p,
  user: process.env.db_u,
  database: process.env.db,
});

database.connect((error) => {
  if (error) {
    throw error;
  }
});

export const query = <T = DefaultQueryResult>(
  query: string,
): Promise<QueryResult<T>> => {
  return new Promise((resolve, reject) => {
    database.query(query, (error, request) => {
      if (error) return reject(error);
      resolve(request);
    });
  });
};
