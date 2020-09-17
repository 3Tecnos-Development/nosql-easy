import { IRepository } from "./IRepository";

export interface IProvider
{
  name:string,
  repository:IRepository
}