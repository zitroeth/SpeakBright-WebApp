import { useContext, } from 'react';
import { getFirestore, doc, getDoc, Firestore } from 'firebase/firestore';
import AuthContext from '../contexts/AuthContext';

const db = getFirestore();

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

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