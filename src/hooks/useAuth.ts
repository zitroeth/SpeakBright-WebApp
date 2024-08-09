import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getFirestore, doc, getDoc, Firestore } from 'firebase/firestore';

const db = getFirestore();

const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { currentUser, loading };
};

export async function checkIfDocumentExists(collection: string, docId: string, firestore: Firestore = db): Promise<boolean> {
    const docRef = doc(firestore, collection, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
        return true;
    } else {
        console.log("No such document!");
        return false;
    }
}

export default useAuth;