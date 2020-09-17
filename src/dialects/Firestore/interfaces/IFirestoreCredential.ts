export interface IFirestoreCredential{
  credential:{
    projectId:string,
    clientEmail:string,
    privateKey:string
  },
  databaseURL:string
}