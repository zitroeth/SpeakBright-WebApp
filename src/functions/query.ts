import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function getStudents(guardianId: string) {
    const querySnapshot = await getDocs(collection(db, "user_guardian", guardianId, "students"));
    const studentsMap = new Map();
    querySnapshot.forEach(doc => {
        studentsMap.set(doc.id, doc.data());
    });

    return studentsMap;
}

