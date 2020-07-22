
import { IRepository } from "./interfaces/IRepository";
import { IProvider } from "./interfaces/IProvider";
import { Options } from "./types/Options";
import { MapEnv } from "map-env-node";
import { FirestoreRepository } from "./providers/Firestore/FirestoreRepository";
import { NoSqlEasyConfig } from "./Config";
import { WhereFilterOp } from "./types/Where";
import { OrderByDirection } from "./types/OrderBy";

export class NoSqlEasy implements IRepository
{
    providers = Array<IProvider>();
    repository:IRepository;

    constructor()   
    {
        this.providers = [ 
            {name: "Firestore", repository: new FirestoreRepository() }
        ];

        this.repository = this.getRepository();
    }

    private getRepository(): IRepository
    {
        let filter = this.providers.filter(p => p.name === NoSqlEasyConfig.getProviderName());
        if(filter.length > 0)
        {
            return filter[0].repository;
        }
        throw new Error("Provedor de Repositório não definido!");
    }

    async insertWithId<T>(collection: string, data: T): Promise<T> {
        return await this.repository.insertWithId<T>(collection, data)
    }

    async insert<T>(collection:string, data: T): Promise<T> {
        return await this.repository.insert<T>(collection, data);
    }

    async insertElementInArray(collection:string, id: string, arrayFieldName:string, value: any): Promise<void>{
        return await this.repository.insertElementInArray(collection, id, arrayFieldName, value);
    }

    async getCollection<T>(collection:string, options?:Options<T>): Promise<T[]> {
        return await this.repository.getCollection<T>(collection, options);
    }

    async getById<T>(collection:string, id: string): Promise<T> {
        return await this.repository.getById(collection, id);
    }

    async getByValue<T>(collection:string, fieldPath:string, value: any, operator?: WhereFilterOp): Promise<T[]>{
        return await this.repository.getByValue<T>(collection, fieldPath, value, operator);
    }

    async getByValueOrdered<T>(collection:string, 
                                fieldPath:string, 
                                whereFilter: WhereFilterOp, 
                                value: any, 
                                fieldOrder:string, 
                                direction?: OrderByDirection){
        return await this.repository.getByValueOrdered<T>(collection, fieldPath, whereFilter, value, fieldOrder, direction);
    }

    async update<T>(collection:string, data: T){
        return await this.repository.update<T>(collection, data);
    }

    async updateField<T>(collection: string, id:string, fieldName: keyof T, value: any){
        return await this.repository.updateField(collection, id, fieldName, value);
    }

    async remove(collection: string, id: string): Promise<void> {
        return await this.repository.remove(collection, id);
    }

    async exists(collection: string, id: string): Promise<boolean> {
        return await this.repository.exists(collection, id);
    }
}