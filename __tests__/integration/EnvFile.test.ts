import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

describe('Arquivo .env', () =>{
    it('Arquivo .env existe', () => {
        const filePath = './.env';
        expect(fs.existsSync(filePath)).toBe(true);
    })

    it('A variável FIRESTORE_CREDENTIAL foi definida no arquivo .env', () => {
        const nodeEnvIsNotNull = !!process.env.FIRESTORE_CREDENTIAL;
        expect(nodeEnvIsNotNull).toBe(true);
    })

    it('A variável FIRESTORE_CREDENTIAL está no formato JSON válido', () => {
        const json = JSON.parse(process.env.FIRESTORE_CREDENTIAL!);

        expect(json.hasOwnProperty('credential')).toBe(true);
    })
})

