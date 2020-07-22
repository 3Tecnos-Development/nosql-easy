import { Where } from './Where';
import { OrderBy } from './OrderBy';

interface IOptions<T>{
    whereCollection?:Where<T>[];
    orderByCollection?:OrderBy<T>[];
    limit?: number;
    offset?: number;
}

export type Options<T> = IOptions<T>;

