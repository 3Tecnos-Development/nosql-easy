import { DialectType } from "./types/DialectType";

export class Config {
    private dialectType:DialectType;

    setDialect(providerType:DialectType){
        this.dialectType = providerType;
    }

    getDialectName():string {
        if(!this.dialectType){
            throw new Error("É necessário definir qual será o provedor de Dados.");
        }
        return this.dialectType.toString();
    }
}

export const NoSqlEasyConfig = new Config();