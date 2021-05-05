import { MapEnv } from "map-env-node";
import { IFirestoreCredential } from "../../interfaces";

export const getCredentials = (): IFirestoreCredential => {
  let projectId: string;
  let clientEmail: string;
  let privateKey: string;
  let databaseURL: string;

  if (process.env.FIRESTORE_CREDENTIAL) {
    const firestoreCredential = MapEnv.get<IFirestoreCredential>(
      "FIRESTORE_CREDENTIAL",
    );

    projectId = firestoreCredential.credential.projectId;
    clientEmail = firestoreCredential.credential.clientEmail;
    privateKey = firestoreCredential.credential.privateKey;
    databaseURL = firestoreCredential.databaseURL;
  } else {
    projectId = process.env.FIRESTORE_PROJECT_ID!;
    clientEmail = process.env.FIRESTORE_CLIENT_EMAIL!;
    if (process.env.FIRESTORE_PRIVATE_KEY_BASE64) {
      const privateKeyB64 = Buffer.from(
        process.env.FIRESTORE_PRIVATE_KEY_BASE64,
        "base64",
      );
      privateKey = privateKeyB64.toString("utf8");
    } else {
      privateKey = process.env.FIRESTORE_PRIVATE_KEY!;
    }
    databaseURL = process.env.FIRESTORE_DATABASE_URL!;
  }

  return {
    credential: {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    },
    databaseURL,
  };
};
