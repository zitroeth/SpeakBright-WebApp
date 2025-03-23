import { collection, getDocs, doc, getDoc, addDoc, query, where, deleteDoc, orderBy, updateDoc, limit, setDoc, getDocsFromServer, getCountFromServer, } from 'firebase/firestore';
import { getDownloadURL, ref, StorageReference, uploadBytes } from "firebase/storage";
import { storage, db, auth } from '../config/firebase';
import { adminAuth } from '../config/admin';
import { Timestamp } from 'firebase/firestore';
import { MainCategory } from '../components/SortableCategory';
import { radioClasses } from '@mui/material';
import { Category } from '../pages/Ranking';
import { CategoryCard } from '../components/SortableCards';

export async function getStudents(guardianId: string) {
    const querySnapshot = await getDocs(collection(db, "user_guardian", guardianId, "students"));
    const studentsMap = new Map();
    querySnapshot.forEach(doc => {
        studentsMap.set(doc.id, doc.data());
    });

    return studentsMap;
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

export type StudentInfo = {
    birthday: Timestamp;
    email: string;
    name: string;
    phase: number;
    userID: string;
    userType: string;
}

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
        phase: data.phase as number,
        userID: data.userID as string,
        userType: data.userType as string,
    };

    return studentInfo;
}

export async function getCardCategories() {
    const querySnapshot = await getDocs(collection(db, "categories"));
    const categoriesMap = new Map<string, { category: string }>();
    querySnapshot.forEach(doc => {
        categoriesMap.set(doc.id as string, doc.data() as { category: string });
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

export async function setCard(
    card_data: {
        category: string,
        imageUrl?: string,
        phase1_independence: boolean,
        phase2_independence: boolean,
        phase3_independence: boolean,
        tapCount: number,
        title: string,
        userId: string,
    },
    cardRef?: StorageReference) {
    try {
        // If manual card input
        if (card_data.imageUrl === undefined) {
            const downloadURL = await getDownloadURL(cardRef as StorageReference);
            card_data.imageUrl = downloadURL;
        }

        const addedCardRef = await addDoc(collection(db, "cards"), card_data);

        // Set userdoc to categoryRanking > $userId
        const categoryRankingRef = doc(db, "categoryRanking", card_data.userId);
        await setDoc(categoryRankingRef, { studentID: card_data.userId }, { merge: true });

        // Count number of doc in a category subcollection
        const categoryCountColl = collection(db, "categoryRanking", card_data.userId, card_data.category);
        const categoryCountsnapshot = await getCountFromServer(categoryCountColl);

        // Set carddoc to categoryRanking > $userId > $category > $cardId
        const categoryRankingCardRef = doc(db, "categoryRanking", card_data.userId, card_data.category, addedCardRef.id);
        await setDoc(categoryRankingCardRef, {
            cardID: addedCardRef.id,
            cardTitle: card_data.title,
            imageUrl: card_data.imageUrl,
            rank: categoryCountsnapshot.data().count + 1
        });

    } catch (error) {
        alert(error);
    }
}

export type StudentCard = {
    category: string,
    imageUrl: string,
    isFavorite?: boolean,
    phase1_completion?: Timestamp,
    phase2_completion?: Timestamp,
    phase3_completion?: Timestamp,
    phase1_independence?: boolean,
    phase2_independence?: boolean,
    phase3_independence?: boolean,
    tapCount: number,
    title: string,
    userId: string,
    cardId?: string,
}

export async function getStudentCards(studentId: string) {
    const cardQuery = await query(collection(db, "cards"), where("userId", "==", studentId));
    const cardSnapshot = await getDocs(cardQuery);
    const cardMap = new Map();
    cardSnapshot.forEach(doc => {
        cardMap.set(doc.id, { ...doc.data(), cardId: doc.id } as StudentCard);
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
        const cardDoc = await getDoc(doc(db, "cards", cardId));
        await deleteDoc(doc(db, "cards", cardId));

        if (cardDoc.get("isFavorite")) {
            await deleteDoc(doc(db, "favorites", cardDoc.get("userId"), "cards", cardId));
        }
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
        const cardQuery = query(collection(db, "cards"), where("userId", "==", studentId));
        const cardSnapshot = await getDocs(cardQuery);
        cardSnapshot.forEach(async (docSnapshot) => {
            await deleteDoc(docSnapshot.ref);
            if (docSnapshot.get("isFavorite")) {
                await deleteDoc(doc(db, "favorites", studentId, "cards", docSnapshot.id));
            }
        });
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

export type ChartData = {
    dateArray: string[];
    gesturalArray: number[];
    independentArray: number[];
    modelingArray: number[];
    physicalArray: number[];
    verbalArray: number[];
    independentWrongArray: number[];
}

// export async function getStudentPromptData(studentId: string, studentPhase: string, filterType: string): Promise<ChartData> {
//     try {
//         const sessionQuery = query(collection(db, `activity_log`, studentId, `phase`, studentPhase, `session`));

//         const sessionSnapshot = await getDocs(sessionQuery);

//         const dailyData: {
//             [date: string]: {
//                 gestural: number, independent: number, modeling: number, physical: number, verbal: number
//             }
//         } = {};

//         for (const sessionDoc of sessionSnapshot.docs) {
//             const sessionData = sessionDoc.data();
//             const sessionDate = (sessionData.timestamp as Timestamp).toDate(); // Convert to Date object

//             const trialPromptQuery = query(collection(db, `activity_log`, studentId, `phase`, studentPhase, `session`, sessionDoc.id, `trialPrompt`));
//             const trialSnapshot = await getDocs(trialPromptQuery);

//             trialSnapshot.forEach((trialDoc) => {
//                 const trialData = trialDoc.data();
//                 const { prompt } = trialData as { prompt: string };

//                 // Format the session date based on the filter type
//                 let formattedDate: string;
//                 switch (filterType) {
//                     case 'Daily': {
//                         formattedDate = sessionDate.toLocaleDateString();
//                         break;
//                     }
//                     case 'Weekly': {
//                         const weekStart = new Date(sessionDate);
//                         weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());

//                         const weekEnd = new Date(weekStart);
//                         weekEnd.setDate(weekStart.getDate() + 6);

//                         console.log(sessionDate)
//                         console.log(`start: ${weekStart} \nend: ${weekEnd}`)

//                         formattedDate = `${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`;
//                         break;
//                     }
//                     case 'Monthly': {
//                         const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
//                         formattedDate = `${monthNames[sessionDate.getMonth()]} ${sessionDate.getFullYear()}`;
//                         break;
//                     }
//                     default: {
//                         formattedDate = sessionDate.toISOString().split('T')[0]; // Default to day
//                         break;
//                     }
//                 }

//                 if (!dailyData[formattedDate]) {
//                     dailyData[formattedDate] = {
//                         gestural: 0,
//                         independent: 0,
//                         modeling: 0,
//                         physical: 0,
//                         verbal: 0,
//                     };
//                 }

//                 switch (prompt) {
//                     case "Gestural":
//                         dailyData[formattedDate].gestural += 1;
//                         break;
//                     case "Independent":
//                         dailyData[formattedDate].independent += 1;
//                         break;
//                     case "Modeling":
//                         dailyData[formattedDate].modeling += 1;
//                         break;
//                     case "Physical":
//                         dailyData[formattedDate].physical += 1;
//                         break;
//                     case "Verbal":
//                         dailyData[formattedDate].verbal += 1;
//                         break;
//                     default:
//                         break;
//                 }
//             });
//         }

//         // Prepare arrays for the chart
//         const dateArray: string[] = [];
//         const gesturalArray: number[] = [];
//         const independentArray: number[] = [];
//         const modelingArray: number[] = [];
//         const physicalArray: number[] = [];
//         const verbalArray: number[] = [];

//         Object.keys(dailyData).forEach(date => {
//             dateArray.push(date);
//             gesturalArray.push(dailyData[date].gestural);
//             independentArray.push(dailyData[date].independent);
//             modelingArray.push(dailyData[date].modeling);
//             physicalArray.push(dailyData[date].physical);
//             verbalArray.push(dailyData[date].verbal);
//         });

//         return {
//             dateArray,
//             gesturalArray,
//             independentArray,
//             modelingArray,
//             physicalArray,
//             verbalArray,
//         };
//     } catch (error) {
//         console.error(error);
//         return {
//             dateArray: [],
//             gesturalArray: [],
//             independentArray: [],
//             modelingArray: [],
//             physicalArray: [],
//             verbalArray: [],
//         };
//     }
// }

export type PhasePromptMap = Map<string, {
    entryTimestamps?: Timestamp[], exitTimestamps?: Timestamp[], session: SessionPromptMap
}>;
export type SessionPromptMap = Map<string, {
    timestamp: Timestamp, independentCount: number, totalTaps: number, trialPrompt: TrialPromptMap
}>;
export type TrialPromptMap = Map<string, {
    cardID: string, prompt: string, timestamp: Timestamp
}>;

export async function getPhasesPromptData(studentID: string): Promise<PhasePromptMap> {
    const phasePromptMap: PhasePromptMap = new Map();

    const phaseRef = collection(db, `activity_log/${studentID}/phase`);
    const phaseSnapshot = await getDocs(phaseRef);

    for (const phaseDoc of phaseSnapshot.docs) {
        phasePromptMap.set(phaseDoc.id,
            {
                entryTimestamps: phaseDoc.get('entryTimestamps') as Timestamp[],
                exitTimestamps: phaseDoc.get('exitTimestamps') as Timestamp[],
                session: await getStudentPromptData(studentID, phaseDoc.id)
            });
    }
    return phasePromptMap;
}

export async function getStudentPromptData(studentId: string, studentPhase: string): Promise<SessionPromptMap> {
    const sessionPromptMap: SessionPromptMap = new Map();

    const sessionRef = collection(db, `activity_log/${studentId}/phase/${studentPhase}/session`);
    const sessionSnapshot = await getDocs(sessionRef);

    for (const sessionDoc of sessionSnapshot.docs) {
        const trialPromptRef = collection(db, `activity_log/${studentId}/phase/${studentPhase}/session/${sessionDoc.id}/trialPrompt`);
        const trialPromptSnapshot = await getDocs(trialPromptRef);

        const trialPromptMap: TrialPromptMap = new Map();
        for (const trialPromptDoc of trialPromptSnapshot.docs) {
            trialPromptMap.set(trialPromptDoc.id, {
                cardID: trialPromptDoc.data().cardID as string,
                prompt: trialPromptDoc.data().prompt as string,
                timestamp: trialPromptDoc.data().timestamp as Timestamp,
            });
        }

        sessionPromptMap.set(sessionDoc.id,
            {
                timestamp: sessionDoc.data().timestamp as Timestamp,
                independentCount: sessionDoc.data().independentCount as number,
                totalTaps: sessionDoc.data().totalTaps as number,
                trialPrompt: trialPromptMap
            });

    }
    return sessionPromptMap;
}

export function getCardIdsFromStudentPromptData(phasePromptData: PhasePromptMap | null) {
    const studentCardIds: string[] = [];
    if (!phasePromptData) return studentCardIds;

    phasePromptData.forEach(phasePrompt => {
        phasePrompt.session.forEach(sessionPrompt => {
            sessionPrompt.trialPrompt.forEach(trialPrompt => {
                if (!studentCardIds.includes(trialPrompt.cardID))
                    studentCardIds.push(trialPrompt.cardID);
            });
        }
        );
    });
    return studentCardIds;
}

function deepCopyPhasePromptMap(originalMap: PhasePromptMap): PhasePromptMap {
    if (!originalMap) {
        return new Map();
    }

    const newMap: PhasePromptMap = new Map();

    originalMap.forEach((phaseData, phaseId) => {
        const newSessionMap: SessionPromptMap = new Map();

        phaseData.session.forEach((sessionData, sessionId) => {
            const newTrialPromptMap: TrialPromptMap = new Map();

            sessionData.trialPrompt.forEach((trialData, trialId) => {
                newTrialPromptMap.set(trialId, { ...trialData }); // Deep copy trial data
            });

            newSessionMap.set(sessionId, {
                ...sessionData,
                trialPrompt: newTrialPromptMap
            });
        });

        newMap.set(phaseId, {
            ...phaseData,
            session: newSessionMap,
            entryTimestamps: phaseData.entryTimestamps?.map(ts => ts), // Copy timestamps
            exitTimestamps: phaseData.exitTimestamps?.map(ts => ts)
        });
    });

    return newMap;
}

export function filterStudentChartData(phasePromptData: PhasePromptMap | null, phase: string, cardID: string, startDate?: Date, endDate?: Date): ChartData {
    const chartData = {
        dateArray: [],
        gesturalArray: [],
        independentArray: [],
        modelingArray: [],
        physicalArray: [],
        verbalArray: [],
        independentWrongArray: [],
    } as ChartData;

    // console.log(`phasePromptData ${phasePromptData}`)
    // console.log(`phase ${phase}`)
    // console.log(`cardId ${cardID}`)
    // console.log(`startDate ${startDate}`)
    // console.log(`endDate ${endDate}`)

    const filteredPhasePromptData: PhasePromptMap = deepCopyPhasePromptMap(phasePromptData as PhasePromptMap);

    if (phase !== "All") {
        filteredPhasePromptData.forEach((phasePrompt, phaseId) => {
            if (phaseId !== phase) {
                filteredPhasePromptData.delete(phaseId);
            }
        });
    }

    if (cardID !== "All") {
        filteredPhasePromptData.forEach((phase) => {
            phase.session.forEach((sessionPrompt, sessionId) => {
                sessionPrompt.trialPrompt.forEach((trialPrompt, trialPromptId) => {
                    if (trialPrompt.cardID !== cardID) {
                        sessionPrompt.trialPrompt.delete(trialPromptId);
                    }
                });

                if (sessionPrompt.trialPrompt.size === 0) {
                    filteredPhasePromptData.delete(sessionId);
                }
            });
        });
    }

    if (startDate) {
        filteredPhasePromptData.forEach((phasePrompt) => {
            phasePrompt.session.forEach((sessionPrompt, sessionId) => {
                sessionPrompt.trialPrompt.forEach((trialPrompt, trialPromptId) => {
                    if (trialPrompt.timestamp.toDate().valueOf() < startDate.valueOf()) {
                        sessionPrompt.trialPrompt.delete(trialPromptId);
                    }
                });

                if (sessionPrompt.trialPrompt.size === 0) {
                    filteredPhasePromptData.delete(sessionId);
                }
            });
        });
    }

    if (endDate) {
        filteredPhasePromptData.forEach((phasePrompt) => {
            phasePrompt.session.forEach((sessionPrompt, sessionId) => {
                sessionPrompt.trialPrompt.forEach((trialPrompt, trialPromptId) => {
                    if (trialPrompt.timestamp.toDate().valueOf() > endDate.valueOf() + 86399999) {
                        sessionPrompt.trialPrompt.delete(trialPromptId);
                    }
                });

                if (sessionPrompt.trialPrompt.size === 0) {
                    filteredPhasePromptData.delete(sessionId);
                }
            });
        });
    }

    // const dailyData: { [key: string]: { gestural: number; independent: number; modeling: number; physical: number; verbal: number, independentWrong: number } } = {};

    // filteredPhasePromptData.forEach((phasePrompt) => {
    //     phasePrompt.session.forEach((sessionPrompt) => {
    //         const sessionDate = sessionPrompt.timestamp.toDate();

    //         sessionPrompt.trialPrompt.forEach((trialPrompt) => {
    //             const { prompt, timestamp } = trialPrompt;

    //             const formattedDate = (startDate?.toISOString().split('T')[0] === endDate?.toISOString().split('T')[0] && startDate && endDate)
    //                 // ? `${String(timestamp.toDate().getHours()).padStart(2, '0')}:${String(timestamp.toDate().getMinutes()).padStart(2, '0')}`
    //                 ? timestamp.toDate().toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', second: 'numeric' })
    //                 : sessionDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', });
    //             // : sessionDate.toLocaleDateString();

    //             if (!dailyData[formattedDate]) {
    //                 dailyData[formattedDate] = {
    //                     gestural: 0,
    //                     independent: 0,
    //                     modeling: 0,
    //                     physical: 0,
    //                     verbal: 0,
    //                     independentWrong: 0,
    //                 };
    //             }

    //             switch (prompt) {
    //                 case "Gestural":
    //                     dailyData[formattedDate].gestural += 1;
    //                     break;
    //                 case "Independent":
    //                     dailyData[formattedDate].independent += 1;
    //                     break;
    //                 case "Modeling":
    //                     dailyData[formattedDate].modeling += 1;
    //                     break;
    //                 case "Physical":
    //                     dailyData[formattedDate].physical += 1;
    //                     break;
    //                 case "Verbal":
    //                     dailyData[formattedDate].verbal += 1;
    //                     break;
    //                 case "IndependentWrong":
    //                     dailyData[formattedDate].independentWrong += 1;
    //                     break;
    //                 default:
    //                     break;
    //             }
    //         });
    //     });

    //     // Sort the dates in ascending order
    //     const sortedDates = (startDate?.toISOString().split('T')[0] === endDate?.toISOString().split('T')[0] && startDate && endDate)
    //         ? Object.keys(dailyData).sort((a, b) => new Date(`1970-01-01 ${a}`).valueOf() - new Date(`1970-01-01 ${b}`).valueOf())
    //         : Object.keys(dailyData).sort((a, b) => new Date(a).valueOf() - new Date(b).valueOf());

    //     // Prepare arrays for the chart
    //     sortedDates.forEach(date => {
    //         chartData.dateArray.push(date);
    //         chartData.gesturalArray.push(dailyData[date].gestural);
    //         chartData.independentArray.push(dailyData[date].independent);
    //         chartData.modelingArray.push(dailyData[date].modeling);
    //         chartData.physicalArray.push(dailyData[date].physical);
    //         chartData.verbalArray.push(dailyData[date].verbal);
    //         chartData.independentWrongArray.push(dailyData[date].independentWrong);
    //     });

    // });
    const dailyData: Map<string, { gestural: number; independent: number; modeling: number; physical: number; verbal: number; independentWrong: number }> = new Map();

    filteredPhasePromptData.forEach((phase) => {
        phase.session.forEach((sessionPrompt) => {
            const sessionDate = sessionPrompt.timestamp.toDate().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

            sessionPrompt.trialPrompt.forEach((trialPrompt) => {
                const { prompt, timestamp } = trialPrompt;
                const sessionDate = sessionPrompt.timestamp.toDate();

                const formattedDate = (startDate?.toISOString().split('T')[0] === endDate?.toISOString().split('T')[0] && startDate && endDate)
                    ? timestamp.toDate().toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', second: 'numeric' })
                    : sessionDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

                if (!dailyData.has(formattedDate)) {
                    dailyData.set(formattedDate, {
                        gestural: 0,
                        independent: 0,
                        modeling: 0,
                        physical: 0,
                        verbal: 0,
                        independentWrong: 0,
                    });
                }

                const dailyEntry = dailyData.get(formattedDate)!;

                switch (prompt) {
                    case "Gestural":
                        dailyEntry.gestural += 1;
                        break;
                    case "Independent":
                        dailyEntry.independent += 1;
                        break;
                    case "Modeling":
                        dailyEntry.modeling += 1;
                        break;
                    case "Physical":
                        dailyEntry.physical += 1;
                        break;
                    case "Verbal":
                        dailyEntry.verbal += 1;
                        break;
                    case "IndependentWrong":
                        dailyEntry.independentWrong += 1;
                        break;
                    default:
                        break;
                }
            });
        });
    });

    // Sort the dates in ascending order
    const sortedDates = Array.from(dailyData.keys()).sort((a, b) => new Date(a).valueOf() - new Date(b).valueOf());

    // Prepare arrays for the chart
    sortedDates.forEach(date => {
        const dailyEntry = dailyData.get(date)!;
        chartData.dateArray.push(date);
        chartData.gesturalArray.push(dailyEntry.gestural);
        chartData.independentArray.push(dailyEntry.independent);
        chartData.modelingArray.push(dailyEntry.modeling);
        chartData.physicalArray.push(dailyEntry.physical);
        chartData.verbalArray.push(dailyEntry.verbal);
        chartData.independentWrongArray.push(dailyEntry.independentWrong);
    });

    // console.log(`dateArray len(${chartData.dateArray.length}): ${chartData.dateArray}`);
    // console.log(`gesturalArray len(${chartData.gesturalArray.length}): ${chartData.gesturalArray}`);
    // console.log(`independentArray len(${chartData.independentArray.length}): ${chartData.independentArray}`);
    // console.log(`modelingArray len(${chartData.modelingArray.length}): ${chartData.modelingArray}`);
    // console.log(`physicalArray len(${chartData.physicalArray.length}): ${chartData.physicalArray}`);
    // console.log(`verbalArray len(${chartData.verbalArray.length}): ${chartData.verbalArray}`);
    // console.log(`independentWrongArray len(${chartData.independentWrongArray.length}): ${chartData.independentWrongArray}`);
    return chartData;
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

export async function getIndependentCardIds(studentId: string, studentPhase: string, minIndependentPercentage: number = 70) {
    // Step 1: Fetch all sessions for the user
    const sessionsRef = collection(db, `activity_log/${studentId}/phase/${studentPhase}/session`);
    const sessionQuery = query(sessionsRef, orderBy("timestamp", "desc"));
    const sessionSnapshots = await getDocs(sessionQuery);
    const cardSessionData: { [cardID: string]: { sessionId: string; independentCount: number; totalCount: number; timestamp: Timestamp }[] } = {};

    // Step 2: Iterate through sessions to process trialPrompts
    for (const session of sessionSnapshots.docs) {
        const sessionData = session.data();
        const trialPromptsRef = collection(db, `activity_log/${studentId}/phase/${studentPhase}/session/${session.id}/trialPrompt`);
        const trialPromptSnapshots = await getDocs(trialPromptsRef);

        // Step 3: Track Independent prompts and total prompts per cardID for each session
        trialPromptSnapshots.forEach((trialPromptDoc) => {
            const { cardID, prompt } = trialPromptDoc.data();
            if (!cardSessionData[cardID]) {
                cardSessionData[cardID] = [];
            }

            let sessionInfo = cardSessionData[cardID].find(s => s.sessionId === session.id);

            if (!sessionInfo) {
                sessionInfo = { sessionId: session.id, independentCount: 0, totalCount: 0, timestamp: sessionData.timestamp };
                cardSessionData[cardID].push(sessionInfo);
            }

            sessionInfo.totalCount += 1;
            if (prompt === "Independent") {
                sessionInfo.independentCount += 1;
            }
        });
    }

    // Step 4: Filter cards by the 3 most recent sessions with at least 70% Independent prompts
    const resultCardIDs = Object.keys(cardSessionData).filter((cardID) => {
        // console.log(cardID)
        // Sort by session timestamp (most recent first)
        const sortedSessions = cardSessionData[cardID].sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

        // Take the 3 most recent sessions
        const recentSessions = sortedSessions.slice(0, 3);

        // Calculate total Independent count and total prompt count across the 3 most recent sessions
        const totalIndependent = recentSessions.reduce((sum, session) => sum + session.independentCount, 0);
        const totalPrompts = recentSessions.reduce((sum, session) => sum + session.totalCount, 0);

        // Calculate percentage of Independent prompts
        const independentPercentage = (totalIndependent / totalPrompts) * 100;

        // Return true if Independent percentage is >= 70%
        return independentPercentage >= minIndependentPercentage;
    });

    return resultCardIDs;
}

// for (let i = 1; i <= 10; i++) {
//     console.log(`total: ${i}\nneed: ${Math.ceil((i * 0.7).toFixed(1))}\n`);
// }

export async function getStudentCardsUsingIds(studentId: string, cardIds: string[]) {
    const cardQuery = await query(collection(db, "cards"), where("userId", "==", studentId));
    const cardSnapshot = await getDocs(cardQuery);
    const cardMap = new Map<string, { category: string, imageUrl: string, tapCount: number, title: string, userId: string }>();
    cardSnapshot.forEach(doc => {
        if (cardIds.includes(doc.id as string))
            cardMap.set(doc.id as string, doc.data() as { category: string, imageUrl: string, tapCount: number, title: string, userId: string });
    });

    return cardMap;
}

export async function getFavoriteCardIds(studentId: string) {
    const cardQuery = await query(collection(db, "favorites", studentId, "cards"), orderBy("cardID", "asc"));
    const cardSnapshot = await getDocs(cardQuery);
    const cardIds: string[] = [];
    cardSnapshot.forEach(doc => {
        cardIds.push(doc.id);
    });

    return cardIds;
}

export async function setCardFavorite(
    studentId: string,
    card: {
        cardID: string;
        category: string;
        imageUrl: string;
        rank?: number;
        title: string;
    },
    setFavorite: boolean) {
    try {
        const favRef = doc(db, 'favorites', studentId);
        setDoc(favRef, { studentID: studentId }, { merge: true });

        if (setFavorite) {
            console.log('setting favorite')
            const cardRef = doc(db, "cards", card.cardID);
            await updateDoc(cardRef, {
                isFavorite: true
            });

            const highestFavoriteCardRankQuery = await query(collection(db, "favorites", studentId, "cards"), orderBy("rank", "desc"), limit(1));
            const highestFavoriteCardRankSnapshot = await getDocs(highestFavoriteCardRankQuery);
            card.rank = highestFavoriteCardRankSnapshot.docs[0] ? highestFavoriteCardRankSnapshot.docs[0].get("rank") + 1 : 1;

            const favoriteCardRef = doc(db, "favorites", studentId, "cards", card.cardID);
            setDoc(favoriteCardRef, card, { merge: true })

        } else {
            console.log('delete favorite')
            const cardRef = doc(db, "cards", card.cardID);
            await updateDoc(cardRef, {
                isFavorite: false
            });


            const favoriteCardRef = doc(db, "favorites", studentId, "cards", card.cardID);
            // Save card as variable
            const favoriteCard = await getDoc(favoriteCardRef);
            // Delete card from favorites collection
            deleteDoc(favoriteCardRef);

            // Adjust the ranking of other student favorite cards
            const unadjustedFavoriteCardsQuery = await query(collection(db, "favorites", studentId, "cards"), where("rank", ">", favoriteCard.get("rank")), limit(9));
            const unadjustedFavoriteCardsSnapshot = await getDocs(unadjustedFavoriteCardsQuery);
            unadjustedFavoriteCardsSnapshot.forEach(async doc => {
                await updateDoc(doc.ref, {
                    rank: doc.get("rank") - 1
                });
            });
        }
    } catch (error) {
        return Promise.reject(error);
    }
    return Promise.resolve(`Favorite card updated successfully`);
}
interface FavoriteCard {
    cardID: string;
    category: string;
    imageUrl: string;
    rank: number;
    title: string;
}

export async function getStudentFavoriteCards(studentId: string) {
    const cardQuery = await query(collection(db, "favorites", studentId, "cards"), orderBy("rank", "asc"), limit(10));
    const cardSnapshot = await getDocs(cardQuery);
    const cardArray = new Array<FavoriteCard>();
    cardSnapshot.forEach(doc => {
        cardArray.push(doc.data() as FavoriteCard);
    });

    return cardArray;
}

export async function setStudentFavoriteCardRank(studentId: string, cardId: string, rank: number) {
    const favRef = doc(db, 'favorites', studentId);
    setDoc(favRef, { studentID: studentId }, { merge: true });

    const favoriteCardRef = doc(db, "favorites", studentId, "cards", cardId);

    try {
        await updateDoc(favoriteCardRef, {
            rank: rank
        });
        return Promise.resolve(`Rank updated successfully [${cardId}, ${rank}]`);
    } catch (error) {
        return Promise.reject(error);
    }
}

export async function getStudentFavoriteCardsCount(studentId: string) {
    const coll = collection(db, "favorites", studentId, "cards")
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
}

export async function getRecentlyCreatedStudent(userData: { birthday: Timestamp, email: string, name: string, userID: string, userType: string }) {
    const studentDocQuery =
        await query(collection(db, "users"),
            where("birthday", "==", userData.birthday),
            where("email", "==", userData.email),
            where("name", "==", userData.name),
            where("userID", "==", userData.userID),
            where("userType", "==", userData.userType),
            limit(1),
        );
    const studentDoc = await getDocs(studentDocQuery);
    return studentDoc.docs[0].get("userID") as string;
}

export async function getCardId(category: string, imageUrl: string, tapCount: number, title: string, userId: string) {
    const cardDocQuery =
        await query(collection(db, "cards"),
            where("category", "==", category),
            where("imageUrl", "==", imageUrl),
            where("tapCount", "==", tapCount),
            where("title", "==", title),
            where("userId", "==", userId),
            limit(1),
        );
    const cardDoc = await getDocs(cardDocQuery);
    console.log(cardDoc.docs)
    return cardDoc.docs[0].id as string;
}

export async function getStudentPhaseDurationPieChart(studentId: string) {
    const phasesSnapshot = await getDocs(collection(db, "activity_log", studentId, "phase"));
    const phasesSnapshotMap = new Map<string, { entryTimestamps: Timestamp[], exitTimestamps: Timestamp[] }>();
    phasesSnapshot.forEach(doc => {
        phasesSnapshotMap.set(doc.id, doc.data() as { entryTimestamps: Timestamp[], exitTimestamps: Timestamp[] });
    });

    const phasesDuration = new Array<{ label: string | ((location: 'tooltip' | 'legend' | 'arc') => string), value: number }>();
    phasesSnapshotMap.forEach((phase, phaseId) => {
        const entryTimestamps = phase.entryTimestamps;
        const exitTimestamps = phase.exitTimestamps;
        if (entryTimestamps.length > exitTimestamps.length)
            exitTimestamps.push(Timestamp.now());

        let totalDuration = 0;
        entryTimestamps.forEach((entryTimestamp, index) => {
            const exitTimestamp = exitTimestamps[index];
            totalDuration += exitTimestamp.toMillis() - entryTimestamp.toMillis();
        });

        phasesDuration.push({ label: (location) => (location === 'legend') ? `Phase ${phaseId} - ${convertMillisecondsToReadableString(totalDuration)}` : `Phase ${phaseId}`, value: totalDuration });
    });

    return phasesDuration;
}

export async function getStudentPhaseDuration(studentId: string) {
    const phasesSnapshot = await getDocs(collection(db, "activity_log", studentId, "phase"));
    const phasesSnapshotMap = new Map<string, { entryTimestamps: Timestamp[], exitTimestamps: Timestamp[] }>();
    phasesSnapshot.forEach(doc => {
        phasesSnapshotMap.set(doc.id, doc.data() as { entryTimestamps: Timestamp[], exitTimestamps: Timestamp[] });
    });

    const phasesDuration = new Array<{ label: string, value: number }>();
    phasesSnapshotMap.forEach((phase, phaseId) => {
        const entryTimestamps = phase.entryTimestamps;
        const exitTimestamps = phase.exitTimestamps;
        if (entryTimestamps.length > exitTimestamps.length)
            exitTimestamps.push(Timestamp.now());

        let totalDuration = 0;
        entryTimestamps.forEach((entryTimestamp, index) => {
            const exitTimestamp = exitTimestamps[index];
            totalDuration += exitTimestamp.toMillis() - entryTimestamp.toMillis();
        });

        phasesDuration.push({ label: phaseId, value: totalDuration });
    });

    return phasesDuration;
}

export function convertMillisecondsToReadableString(milliseconds: number): string {

    const msInSecond = 1000;
    const msInMinute = 60 * msInSecond;
    const msInHour = 60 * msInMinute;
    const msInDay = 24 * msInHour;
    const msInWeek = 7 * msInDay;
    const msInMonth = 30 * msInDay; // Approximation for months

    const months = Math.floor(milliseconds / msInMonth);
    milliseconds %= msInMonth;

    const weeks = Math.floor(milliseconds / msInWeek);
    milliseconds %= msInWeek;

    const days = Math.floor(milliseconds / msInDay);
    milliseconds %= msInDay;

    const hours = Math.floor(milliseconds / msInHour);
    milliseconds %= msInHour;

    const minutes = Math.floor(milliseconds / msInMinute);
    milliseconds %= msInMinute;

    const seconds = Math.floor(milliseconds / msInSecond);

    // Build the string with at most two components
    const parts: string[] = [];
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

    // Combine at most two parts
    return parts.slice(0, 2).join(', ');
}



const promptWeights = new Map<string, number>([
    ['Independent', 1],
    ['Verbal', 0.75],
    ['Gestural', 0.5],
    ['Modeling', 0.25],
    ['Physical', 0.5],
]);

// type StudentProgressScore = {
//     date: string;
//     score: number;
//     variation: number;
// }

// export function getStudentProgressScore(sessionPromptData: SessionPromptMap | null) {
//     const studentProgressScores: StudentProgressScore[] = [];

//     sessionPromptData?.forEach((sessionPrompt) => {
//         const sessionDate = sessionPrompt.timestamp.toDate();
//         let totalScore = 0;
//         sessionPrompt.trialPrompt.forEach((trialPrompt) => {
//             const promptWeight = promptWeights.get(trialPrompt.prompt);
//             if (promptWeight) {
//                 totalScore += promptWeight;
//             }
//         });
//         studentProgressScores.push({
//             date: sessionDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', }),
//             score: totalScore,
//             variation: 0,
//         });
//     });

//     for (let i = 1; i < studentProgressScores.length; i++) {
//         const currentScore = studentProgressScores[i].score;
//         const previousScore = studentProgressScores[i - 1].score;

//         // Avoid division by zero and calculate the percentage change
//         if (previousScore !== 0) {
//             const percentageChange = ((currentScore - previousScore) / previousScore) * 100;
//             studentProgressScores[i].variation = percentageChange;
//         } else {
//             // If the previous score is zero, set variation to null or another indicator
//             studentProgressScores[i].variation = 0;
//         }
//     }

//     return studentProgressScores;
// }

export type StudentProgressScore = {
    date: Date;
    score: number | null;
}

export async function getStudentProgressScore(sessionPromptData: SessionPromptMap | null) {
    const dayPromptCounts: {
        date: Date;
        independentCount: number;
        totalTaps: number;
    }[] = [];
    const studentProgressScores: StudentProgressScore[] = [];

    sessionPromptData?.forEach((sessionPrompt) => {
        const { independentCount, totalTaps } = sessionPrompt;
        const sessionDate = sessionPrompt.timestamp.toDate();
        sessionDate.setHours(0, 0, 0, 0);

        const indexIfSet = dayPromptCounts.findIndex(d => d.date.getTime() === sessionDate.getTime());
        if (indexIfSet !== -1) {
            dayPromptCounts[indexIfSet].independentCount += independentCount
            dayPromptCounts[indexIfSet].totalTaps += totalTaps
        } else {
            dayPromptCounts.push({
                date: sessionDate,
                independentCount: independentCount,
                totalTaps: totalTaps,
            });
        }

    });

    dayPromptCounts.forEach((dayPromptCount) => {
        console.log(`independent count: ${dayPromptCount.independentCount}, total taps: ${dayPromptCount.totalTaps}`)
        studentProgressScores.push({
            date: dayPromptCount.date,
            score: dayPromptCount.independentCount ? dayPromptCount.independentCount / dayPromptCount.totalTaps * 100 : 0
        });
    });

    // sessionPromptData?.forEach((sessionPrompt) => {
    //     const sessionDate = sessionPrompt.timestamp.toDate();
    //     sessionDate.setHours(0, 0, 0, 0);
    //     const indexIfSet = studentProgressScores.findIndex(d => d.date.getTime() === sessionDate.getTime());

    //     let trialPromptCount = 0;
    //     let independentCount = 0;
    //     sessionPrompt.trialPrompt.forEach((trialPrompt) => {
    //         trialPrompt.prompt === "Independent" ? independentCount++ : null;
    //         trialPromptCount++;
    //     });

    //     const totalScore = independentCount ? independentCount / trialPromptCount * 100 : 0;
    //     console.log(`trialpromt count: ${trialPromptCount}, total score: ${totalScore}`);
    //     // const totalScore = independentCount ? independentCount / 20 * 100 : 0;

    //     if (indexIfSet !== -1) {
    //         studentProgressScores[indexIfSet].score ? studentProgressScores[indexIfSet].score += totalScore : null;
    //     } else {
    //         studentProgressScores.push({
    //             date: sessionDate,
    //             score: totalScore,
    //         });
    //     }

    // });

    const sessionProgressScore: { sessionNumber: number, sessionScore: number }[] =
        studentProgressScores.map((score, index) => ({
            sessionNumber: index + 1,
            sessionScore: score.score
        }));

    console.log(JSON.stringify([studentProgressScores]));
    return studentProgressScores;
}

// export function getFirstCardPromptInstance(studentPromptData: SessionPromptMap | null) {
//     const firstCardInstances = new Map<string, Date>();
//     if (!studentPromptData) return firstCardInstances;

//     studentPromptData.forEach((sessionPrompt) => {
//         sessionPrompt.trialPrompt.forEach((trialPrompt) => {
//             const existingDate = firstCardInstances.get(trialPrompt.cardID);
//             const trialDate = trialPrompt.timestamp.toDate();

//             if (!existingDate || trialDate.valueOf() < existingDate.valueOf()) {
//                 firstCardInstances.set(trialPrompt.cardID, trialDate);
//             }
//         });
//     });

//     return firstCardInstances;
// }

// Define input and output models
export interface DataPoint {
    timeTakenIndependence: number;  // The independence time in milliseconds
}

export interface PredictionRequest {
    data: DataPoint[];
    start: number;  // Start index for prediction
    end: number;    // End index for prediction
}

export interface PredictionResponse {
    predictedSum: number;
}

// Function to send data to the Python API using fetch
export async function fetchExponentialSmoothingPrediction(data: DataPoint[], start: number, end: number): Promise<number> {
    const url = "http://localhost:5174/simple-exponential-smoothing/";

    try {
        const requestBody: PredictionRequest = { data, start, end };
        // Send POST request to the API using fetch
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok)
            throw new Error(`Error: ${response.statusText}`);

        const responseData: PredictionResponse = await response.json();
        return responseData.predictedSum;
    } catch (error) {
        console.error("Error communicating with the API:", error);
        throw error;
    }
}

export async function getCurrentlyLearningCard(studentId: string, phase: string): Promise<{ phase: string, card: StudentCard }> {
    // Step 1: Get the latest session
    const sessionRef = collection(db, "activity_log", studentId, "phase", phase, "session");
    const sessionQuery = query(sessionRef, orderBy("timestamp", "desc"), limit(1));
    const sessionSnapshot = await getDocs(sessionQuery);

    if (sessionSnapshot.empty) {
        return { phase, card: {} as StudentCard };
    }

    const latestSession = sessionSnapshot.docs[0]; // Get the latest session document

    // Step 2: Query the "trialPrompt" subcollection of the latest session
    const trialPromptRef = collection(latestSession.ref, "trialPrompt");
    const trialPromptQuery = query(trialPromptRef, orderBy("timestamp", "desc"), limit(1));
    const trialPromptSnapshot = await getDocs(trialPromptQuery);

    if (trialPromptSnapshot.empty) {
        throw new Error("No trial prompts found in the latest session.");
    }

    // Step 3: Get the `cardID` from the latest trial prompt
    const latestTrialPrompt = trialPromptSnapshot.docs[0];
    const cardID = latestTrialPrompt.get("cardID");

    if (!cardID) {
        throw new Error("cardID is missing in the latest trial prompt.");
    }

    // Step 4: Fetch the card document using the cardID
    const cardDocRef = doc(db, "cards", cardID);
    const cardSnapshot = await getDoc(cardDocRef);

    if (!cardSnapshot.exists()) {
        throw new Error(`Card with ID ${cardID} does not exist.`);
    }

    // Step 5: Return the card data
    return { phase, card: cardSnapshot.data() as StudentCard };
}

export async function setDefaultMainCategoryRanking(studentId: string) {
    try {
        await setDoc(doc(db, "main_category_ranking", studentId), {
            categories: [
                {
                    category: "Food",
                    rank: 2
                },
                {
                    category: "Toys",
                    rank: 3
                },
                {
                    category: "Emotions",
                    rank: 4
                },
                {
                    category: "School",
                    rank: 5
                },
                {
                    category: "Activities",
                    rank: 6
                },
                {
                    category: "Chores",
                    rank: 7
                },
                {
                    category: "Clothing",
                    rank: 8
                },
                {
                    category: "People",
                    rank: 9
                },
                {
                    category: "Places",
                    rank: 10
                }
            ]
        });
        return Promise.resolve(`Default Main Category Ranking set successfully`);
    } catch (error) {
        return Promise.reject(error);
    }
}

export async function getMainCategoryRanking(studentId: string) {
    let categories: MainCategory[] = [
        { category: "Favorites", rank: 1 },
        { category: "Food", rank: 2 },
        { category: "Toys", rank: 3 },
        { category: "Emotions", rank: 4 },
        { category: "School", rank: 5 },
        { category: "Activities", rank: 6 },
        { category: "Chores", rank: 7 },
        { category: "Clothing", rank: 8 },
        { category: "People", rank: 9 },
        { category: "Places", rank: 10 }
    ];
    const docRef = doc(db, "main_category_ranking", studentId);
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
        await setDefaultMainCategoryRanking(studentId);
        return categories as MainCategory[];
    }
    categories = docSnapshot.get('categories') as MainCategory[];
    categories.unshift({ category: "Favorites", rank: 1 });
    return categories;
}

export async function setMainCategoryRanking(studentId: string, mainCategoryRanking: MainCategory[]) {
    const mainCategoryRankingRef = doc(db, 'main_category_ranking', studentId);
    try {
        await updateDoc(mainCategoryRankingRef, {
            categories: mainCategoryRanking
        });
        return Promise.resolve(`Main Category Ranking successfully`);
    } catch (error) {
        return Promise.reject(error);
    }
}

// export async function getCardCategoryRanking(studentId: string) {
//     const categories: Category[] = [
//         "Favorites",
//         "Food",
//         "Toys",
//         "Emotions",
//         "School",
//         "Activities",
//         "Chores",
//         "Clothing",
//         "People",
//         "Places",
//     ];
//     const categoryRankingArray = new Array<{ category: Category, categoryCard: CategoryCard[] }>();

//     categories.forEach(async (category) => {
//         const categoryRankingSnapshot = await getDocs(collection(db, "categoryRanking", studentId, category));
//         const categoryCardArray: CategoryCard[] = []
//         categoryRankingSnapshot.forEach(doc => {
//             console.log(`category: ${category}, doc.data(): ${JSON.stringify(doc.data())}`);
//             categoryCardArray.push(doc.data() as CategoryCard);
//         });
//         categoryRankingArray.push({
//             category: category as Category,
//             categoryCard: categoryCardArray as CategoryCard[]
//         });
//     });
//     console.log(`return categoryRankingArray: ${JSON.stringify(categoryRankingArray)}`);
//     return categoryRankingArray as { category: Category, categoryCard: CategoryCard[] }[];
// }
export async function getCardCategoryRanking(studentId: string): Promise<{ category: Category, categoryCard: CategoryCard[] }[]> {
    const categories: Category[] = [
        "Favorites",
        "Food",
        "Toys",
        "Emotions",
        "School",
        "Activities",
        "Chores",
        "Clothing",
        "People",
        "Places",
    ];

    const categoryRankingArray = await Promise.all(categories.map(async (category) => {
        const categoryRankingQuery = query(collection(db, "categoryRanking", studentId, category), orderBy("rank"));
        const categoryRankingSnapshot = await getDocs(categoryRankingQuery);
        const categoryCardArray: CategoryCard[] = [];
        categoryRankingSnapshot.forEach(doc => {
            categoryCardArray.push(doc.data() as CategoryCard);
        });
        return {
            category: category as Category,
            categoryCard: categoryCardArray as CategoryCard[]
        };
    }));

    const favoriteRankingQuery = query(collection(db, "favorites", studentId, "cards"), orderBy("rank"));
    const favoriteRankingSnapshot = await getDocs(favoriteRankingQuery);
    const favoriteCardArray: CategoryCard[] = [];
    favoriteRankingSnapshot.forEach(doc => {
        favoriteCardArray.push({
            cardID: doc.id,
            cardTitle: doc.get("title") as string,
            imageUrl: doc.get("imageUrl") as string,
            rank: doc.get("rank") as number
        } as CategoryCard);
    });
    categoryRankingArray.unshift({
        category: "Favorites",
        categoryCard: favoriteCardArray as CategoryCard[]
    });
    return categoryRankingArray as { category: Category, categoryCard: CategoryCard[] }[];
}

export async function setCardCategoryRanking(studentId: string, cardId: string, category: string, rank: number) {
    if (category !== "Favorites") {
        const cardCategoryRankingRef = doc(db, 'categoryRanking', studentId, category, cardId);
        try {
            await updateDoc(cardCategoryRankingRef, {
                rank: rank
            });
            return Promise.resolve(`Card Category Ranking updated successfully`);
        } catch (error) {
            return Promise.reject(error);
        }
    } else if (category === "Favorites") {
        try {
            await setStudentFavoriteCardRank(studentId, cardId, rank);
            return Promise.resolve(`Card Category Ranking updated successfully`);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}