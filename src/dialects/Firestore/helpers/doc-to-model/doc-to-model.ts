import { firestore } from "firebase-admin";

export const docToModel = <T>(
  snapShot: firestore.QuerySnapshot<firestore.DocumentData>,
): T[] => {
  const elems = [] as T[];
  if (!snapShot.empty) {
    snapShot.forEach((doc) => {
      const elem = { id: doc.id, ...(doc.data() as T) };
      elems.push(elem);
    });
  }
  return elems;
};
