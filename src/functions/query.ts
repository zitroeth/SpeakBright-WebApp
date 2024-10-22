import { collection, getDocs, doc, getDoc, addDoc, query, where, deleteDoc, orderBy, updateDoc, limit, setDoc, getDocsFromServer } from 'firebase/firestore';
import { getDownloadURL, ref, StorageReference, uploadBytes } from "firebase/storage";
import { storage, db, auth } from '../config/firebase';
import { adminAuth } from '../config/admin';
import { Timestamp } from 'firebase/firestore';

export async function getStudents(guardianId: string) {
    const querySnapshot = await getDocs(collection(db, "user_guardian", guardianId, "students"));
    const studentsMap = new Map();
    querySnapshot.forEach(doc => {
        studentsMap.set(doc.id, doc.data());
    });

    return studentsMap;
}

interface StudentInfo {
    birthday: Timestamp;
    email: string;
    name: string;
    phase?: number;
    userID: string;
    userType: string;
}

// export async function getStudentInfo(studentId: string) {
//     const docSnap = await getDoc(doc(db, "users", studentId));
//     let studentInfo = null;
//     if (docSnap.exists()) {
//         studentInfo = docSnap.data();
//     } else {
//         throw new Error("No student found!");
//     }

//     return studentInfo;
// }

export async function getStudentInfo(studentId: string): Promise<StudentInfo> {
    const docSnap = await getDoc(doc(db, "users", studentId));

    if (!docSnap.exists()) {
        throw new Error("No student found!");
    }

    const data = docSnap.data();

    // Construct the StudentInfo object with appropriate types
    const studentInfo: StudentInfo = {
        birthday: data.birthday as Timestamp,
        email: data.email as string,
        name: data.name as string,
        phase: data.phase ? (data.phase as number) : undefined,
        userID: data.userID as string,
        userType: data.userType as string,
    };

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
    const cardMap = new Map();
    const seenUrls = new Set<string>();

    const ownedCardQuery = query(collection(db, "cards"), where("userId", "==", studentId));
    const ownedCardSnapshot = await getDocs(ownedCardQuery);

    ownedCardSnapshot.forEach(doc => {
        const imageUrl = doc.data().imageUrl;

        // Check if the imageUrl of owned cards is unique
        if (!seenUrls.has(imageUrl)) {
            seenUrls.add(imageUrl);
        }
    });

    const cardQuery = query(collection(db, "cards"), where("userId", "!=", studentId));
    const cardSnapshot = await getDocs(cardQuery);

    cardSnapshot.forEach(doc => {
        const data = doc.data();
        const imageUrl = data.imageUrl;

        // Check if the imageUrl of other cards is unique
        if (!seenUrls.has(imageUrl)) {
            seenUrls.add(imageUrl);
            cardMap.set(doc.id, data);
        }
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

interface Sentence {
    id: string;
    createdAt: Timestamp;
    sentence: string;
    userID: string;
    emotionScores?: any;
}

export async function setEmotionDays(studentId: string) {
    let groupedSentences = await getStudentSentences(studentId);
    groupedSentences = await getEmotionScore(groupedSentences);

    try {
        groupedSentences.forEach(day => {
            const emotionScoreArray: number[] = [];
            let emotionHeaderArray: string[] = [];

            day.sentences.forEach(element => {
                element.emotionScores?.data.forEach((value: number, index: number) => {
                    emotionScoreArray[index] = (emotionScoreArray[index] || 0) + value;
                });
                if (!emotionHeaderArray.length)
                    emotionHeaderArray = element.emotionScores.headers;
            });

            // Find the highest scores and their corresponding emotions
            let highestEmotions: string[] = [];
            const maxScore = Math.max(...emotionScoreArray);

            if (maxScore > 0) {
                highestEmotions = emotionScoreArray
                    .map((score, index) => (score === maxScore ? emotionHeaderArray[index] : null))
                    .filter(Boolean) as string[];
            }

            const emotion_data = {
                date: convertToTimestamp(day.date),
                emotions: highestEmotions,
                userId: studentId,
            };
            setEmotion(emotion_data);
        });
    } catch (error) {
        alert(error);
    }
}

// Set emotion in firebase
// export async function setEmotion(emotion_data: { date: Timestamp, emotion: string, userId: string }) {
//     try {
//         const emotionQuery = query(
//             collection(db, "emotions"),
//             where("date", "==", emotion_data.date),
//             where("userId", "==", emotion_data.userId)
//         );
//         const docId = `${emotion_data.userId}_${emotion_data.date.seconds}`;
//         const querySnapshot = await getDocs(emotionQuery);

//         if (querySnapshot.empty) {
//             await addDoc(collection(db, "emotions", docId));
//         } else {
//             const docId = querySnapshot.docs[0].id;
//             const docRef = doc(db, "emotions", docId);

//             await updateDoc(docRef, emotion_data);
//         }
//         console.log(Date.now());
//     } catch (error) {
//         alert(error);
//     }
// }

export async function setEmotion(emotion_data: { date: Timestamp, emotions: string[], userId: string }) {
    try {
        // Generate a unique document ID based on userId and date
        const docId = `${emotion_data.userId}_${emotion_data.date.seconds}`;

        // Reference to the document using the generated ID
        const docRef = doc(db, "emotions", docId);

        // Check if the document exists
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
            // Update the existing document if it exists
            console.log(`${emotion_data.date.toDate()} ${emotion_data.emotions}`);
            await setDoc(docRef, emotion_data, { merge: true });
        } else {
            // Create a new document if it does not exist
            console.log(`${emotion_data.date.toDate()} ${emotion_data.emotions}`);
            await setDoc(docRef, emotion_data);
        }
    } catch (error) {
        console.error("Error setting emotion:", error);
    }
}

// Get emotion score from FastAPI
export async function getEmotionScore(groupedSentences: { date: string, sentences: Sentence[] }[]) {
    for (const group of groupedSentences) {
        const text_list: string[] = group.sentences.map(sentenceObj => sentenceObj.sentence);

        try {
            // Make a fetch request to the FastAPI endpoint
            const response = await fetch("http://127.0.0.1:5174/Emotion-Analysis/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text_list })
            });

            // Check if the response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Parse the JSON response
            const emotionScores = await response.json();

            if (emotionScores.length !== group.sentences.length) {
                throw new Error("Mismatch between number of sentences and emotion scores.");
            }

            // Assign emotionScores to each sentence
            group.sentences.forEach((sentenceObj, index) => {
                if (index < emotionScores.length) {
                    sentenceObj.emotionScores = emotionScores[index];
                }
            });

        } catch (error) {
            console.error("Error fetching emotion scores:", error);
            alert("An error occurred while fetching emotion scores.");
        }
    }

    return groupedSentences; // Return the grouped sentences with added emotion scores
}

export async function getStudentSentences(studentId: string) {
    // Fetch sentences given a studentId
    const sentencesQuery = await query(collection(db, "sentences"), where("userID", "==", studentId), orderBy("createdAt", 'desc'))

    const sentencesSnapshot = await getDocs(sentencesQuery);
    const sentences: Sentence[] = [];

    sentencesSnapshot.forEach(doc => {
        sentences.push({ id: doc.id, ...doc.data() } as Sentence);
    });

    // Group sentences by day
    const groupedSentences = groupByDay(sentences);

    console.log(groupedSentences)
    return groupedSentences;
}

function groupByDay(sentences: Sentence[]): { date: string, sentences: Sentence[] }[] {
    const grouped: { date: string, sentences: Sentence[] }[] = [];

    sentences.forEach(sentence => {
        const createdAt = sentence.createdAt.toDate();
        const year = createdAt.getFullYear();
        const month = (createdAt.getMonth() + 1).toString().padStart(2, '0');
        const day = createdAt.getDate().toString().padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD

        let group = grouped.find(g => g.date === dateKey);

        if (!group) {
            group = { date: dateKey, sentences: [] };
            grouped.push(group);
        }

        group.sentences.push(sentence);
    });

    return grouped;
}

// Function to convert "YYYY-MM-DD" string to Firebase Timestamp
function convertToTimestamp(dateString: string) {
    // Parse the date string into a JavaScript Date object
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    // Convert the Date object to a Firebase Timestamp
    const timestamp = Timestamp.fromDate(date);

    return timestamp;
}

export async function getStudentLatestEmotion(studentId: string) {
    // Query to get the latest 2 emotion documents for the student
    const emotionQuery = query(
        collection(db, "emotions"),
        where("userId", "==", studentId),
        orderBy("date", "desc"),
        limit(2)
    );

    try {
        const emotionSnapshot = await getDocsFromServer(emotionQuery);
        // Check if there's at least one document
        if (!emotionSnapshot.empty) {
            // Get the latest emotion document
            const latestEmotionDoc = emotionSnapshot.docs.length > 1
                ? emotionSnapshot.docs[0] // 1 if you want second to the last emotion
                : emotionSnapshot.docs[0];
            console.log("latestEmotionDoc")
            console.log(latestEmotionDoc.data())
            return latestEmotionDoc.data();
        } else {
            // No documents found
            return null;
        }
    } catch (error) {
        console.error("Error fetching latest emotion:", error);
        return null;
    }
}

export async function getUserType(uid: string) {
    const q = query(collection(db, "users"), where("userID", "==", uid), limit(1));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs[0].data().userType as string;
}

export async function getUserName(uid: string) {
    const q = query(collection(db, "users"), where("userID", "==", uid), limit(1));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs[0].data().name as string;
}

interface Guardian {
    userID: string;
    name: string;
    email: string;
    birthday: Timestamp;
}

export async function getGuardianList(adminId: string): Promise<Guardian[]> {
    try {
        const q = query(collection(db, "user_admin", adminId, "guardians"));

        // Execute the query to get all documents in the 'guardians' subcollection
        const querySnapshot = await getDocs(q);

        // Map through the documents and extract the data
        const guardianList = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                userID: data.userID as string,
                name: data.name as string,
                email: data.email as string,
                birthday: data.birthday as Timestamp,
            };
        });

        console.log(guardianList);
        return guardianList;
    } catch (error) {
        alert(error);
        return []; // Return an empty array in case of error
    }
}

export async function removeGuardian(adminId: string, guardianId: string) {
    try {
        await deleteDoc(doc(db, "users", guardianId));
        await deleteDoc(doc(db, "user_admin", adminId, "guardians", guardianId));
    } catch (error) {
        alert(error);
    }
}

export async function getStudentsForTable(guardianId: string) {
    try {
        const q = query(collection(db, "user_guardian", guardianId, "students"));

        // Execute the query to get all documents in the 'guardians' subcollection
        const querySnapshot = await getDocs(q);

        // Map through the documents and extract the data
        const studentList = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                userID: data.userID as string,
                name: data.name as string,
                email: data.email as string,
                birthday: data.birthday as Timestamp,
            };
        });

        console.log(studentList);
        return studentList;
    } catch (error) {
        alert(error);
        return []; // Return an empty array in case of error
    }
}

interface ChartData {
    dateArray: string[];
    gesturalArray: number[];
    independentArray: number[];
    modelingArray: number[];
    physicalArray: number[];
    verbalArray: number[];
}

export async function getStudentPromptData(studentId: string, studentPhase: string): Promise<ChartData> {
    try {
        const sessionQuery = query(collection(db, `activity_log`, studentId, `phase`, studentPhase, `session`));

        const sessionSnapshot = await getDocs(sessionQuery);

        const dailyData: {
            [date: string]: {
                gestural: number, independent: number, modeling: number, physical: number, verbal: number
            }
        } = {};

        for (const sessionDoc of sessionSnapshot.docs) {
            const sessionData = sessionDoc.data();
            const sessionDate = (sessionData.timestamp as Timestamp).toDate().toISOString().split('T')[0]; // Format "YYYY-MM-DD"

            const trialPromptQuery = query(collection(db, `activity_log`, studentId, `phase`, studentPhase, `session`, sessionDoc.id, `trialPrompt`));
            const trialSnapshot = await getDocs(trialPromptQuery);

            trialSnapshot.forEach((trialDoc) => {
                const trialData = trialDoc.data();
                const { prompt } = trialData as { prompt: string };

                if (!dailyData[sessionDate]) {
                    dailyData[sessionDate] = {
                        gestural: 0,
                        independent: 0,
                        modeling: 0,
                        physical: 0,
                        verbal: 0,
                    };
                }

                switch (prompt) {
                    case "Gestural":
                        dailyData[sessionDate].gestural += 1;
                        break;
                    case "Independent":
                        dailyData[sessionDate].independent += 1;
                        break;
                    case "Modeling":
                        dailyData[sessionDate].modeling += 1;
                        break;
                    case "Physical":
                        dailyData[sessionDate].physical += 1;
                        break;
                    case "Verbal":
                        dailyData[sessionDate].verbal += 1;
                        break;
                    default:
                        break;
                }

            });
        }

        // Prepare arrays for the chart
        const dateArray: string[] = [];
        const gesturalArray: number[] = [];
        const independentArray: number[] = [];
        const modelingArray: number[] = [];
        const physicalArray: number[] = [];
        const verbalArray: number[] = [];

        Object.keys(dailyData).forEach(date => {
            dateArray.push(date);
            gesturalArray.push(dailyData[date].gestural);
            independentArray.push(dailyData[date].independent);
            modelingArray.push(dailyData[date].modeling);
            physicalArray.push(dailyData[date].physical);
            verbalArray.push(dailyData[date].verbal);
        });

        return {
            dateArray,
            gesturalArray,
            independentArray,
            modelingArray,
            physicalArray,
            verbalArray,
        };
    } catch (error) {
        console.error(error);
        return {
            dateArray: [],
            gesturalArray: [],
            independentArray: [],
            modelingArray: [],
            physicalArray: [],
            verbalArray: [],
        };
    }
}

interface SessionInfo {
    sessionID: string;
    sessionTime: Timestamp;
}

interface TappedCard {
    id: string;
    cardTitle: string;
    category: string;
    timeTapped: Timestamp;
}

export const fetchRecentSessionWithTappedCards = async (userId: string): Promise<{ session: SessionInfo | null; tappedCards: TappedCard[] }> => {
    // Fetch the most recent session
    const sessionsRef = collection(db, `card_basket/${userId}/sessions`);
    const q = query(sessionsRef, orderBy("sessionTime", "desc"), limit(1));
    const sessionSnapshot = await getDocs(q);

    if (!sessionSnapshot.empty) {
        const recentSessionDoc = sessionSnapshot.docs[0];
        const sessionInfo: SessionInfo = {
            sessionID: recentSessionDoc.data().sessionID as string,
            sessionTime: recentSessionDoc.data().sessionTime as Timestamp,
        };

        // Fetch the tapped cards for this session
        const tappedCardsRef = collection(db, `card_basket/${userId}/sessions/${recentSessionDoc.id}/cardsTapped`);
        const cardsSnapshot = await getDocs(tappedCardsRef);
        const tappedCards = cardsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as TappedCard[];

        return { session: sessionInfo, tappedCards };
    }

    return { session: null, tappedCards: [] }; // No sessions found
};