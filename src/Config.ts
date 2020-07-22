import { ProviderType } from "./types/ProviderType";

export class Config {
    private providerType:ProviderType;

    setProvider(providerType:ProviderType){
        this.providerType = providerType;
    }

    getProviderName():string {
        if(!this.providerType){
            throw new Error("É necessário definir qual será o provedor de Dados.");
        }
        return this.providerType.toString();
    }
}

export const NoSqlEasyConfig = new Config();