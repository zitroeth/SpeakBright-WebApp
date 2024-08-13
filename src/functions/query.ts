import { collection, getDocs, doc, getDoc, addDoc, query, where, deleteDoc } from 'firebase/firestore';
import { getDownloadURL, ref, StorageReference, uploadBytes } from "firebase/storage";
import { storage, db, auth } from '../config/firebase';
import { adminAuth } from '../config/admin';

export async function getStudents(guardianId: string) {
    const querySnapshot = await getDocs(collection(db, "user_guardian", guardianId, "students"));
    const studentsMap = new Map();
    querySnapshot.forEach(doc => {
        studentsMap.set(doc.id, doc.data());
    });

    return studentsMap;
}

export async function getStudentInfo(studentId: string) {
    const docSnap = await getDoc(doc(db, "users", studentId));
    let studentInfo = null;
    if (docSnap.exists()) {
        studentInfo = docSnap.data();
    } else {
        throw new Error("No student found!");
    }

    return studentInfo;
}

export async function getCardCategories() {
    const querySnapshot = await getDocs(collection(db, "categories"));
    const categoriesMap = new Map();
    querySnapshot.forEach(doc => {
        categoriesMap.set(doc.id, doc.data());
    });

    return categoriesMap;
}

export async function setImage(imageId: string, image: Blob) {
    const storageRef = ref(storage, `images/${imageId}`);
    try {
        // Upload the file and wait for it to complete
        await uploadBytes(storageRef, image).then((snapshot) => {
            console.log('Uploaded a blob or file!');
        });
    } catch (error) {
        alert(error);
    }
    return storageRef;
}

export async function setCard(card_data: object, cardRef?: StorageReference) {
    try {
        // If manual card input
        if (card_data.imageUrl.length === 0) {
            const downloadURL = await getDownloadURL(cardRef);
            card_data.imageUrl = downloadURL;
        }

        await addDoc(collection(db, "cards"), card_data);
    } catch (error) {
        alert(error);
    }
}

export async function getStudentCards(studentId: string) {
    const cardQuery = await query(collection(db, "cards"), where("userId", "==", studentId));
    const cardSnapshot = await getDocs(cardQuery);
    const cardMap = new Map();
    cardSnapshot.forEach(doc => {
        cardMap.set(doc.id, doc.data());
    });

    return cardMap;
}

export async function getOtherStudentCards(studentId: string) {
    const cardQuery = await query(collection(db, "cards"), where("userId", "!=", studentId));
    const cardSnapshot = await getDocs(cardQuery);
    const cardMap = new Map();
    cardSnapshot.forEach(doc => {
        cardMap.set(doc.id, doc.data());
    });

    return cardMap;
}

export async function getImages() {

}

export async function removeCard(cardId: string) {
    try {
        await deleteDoc(doc(db, "cards", cardId));
    } catch (error) {
        alert(error);
    }
}

export async function removeStudent(guardianId: string, studentId: string) {
    try {
        // Delete student from authentication (Needs separate backend to work)
        // await adminAuth.deleteUser(studentId);   

        // Delete student from users (documentId must match studentId)
        await deleteDoc(doc(db, "users", studentId));

        // Delete guardian's student from user_guardian.students
        await deleteDoc(doc(db, "user_guardian", guardianId, "students", studentId));

        // Delete student sentences from sentences

        // Delete student cards from cards

        // Delete student card_basket and subcollections

    } catch (error) {
        alert(error);
    }
}
