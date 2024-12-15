import { useParams } from "react-router-dom";
// import { getStudentInfo, removeStudent, setEmotionDays } from "../functions/query";
import { getStudentFavoriteCardsCount, getStudentInfo, removeStudent } from "../functions/query";
import { useEffect, useRef, useState } from "react";
// import { collection, doc, DocumentData, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { doc, DocumentData, onSnapshot } from "firebase/firestore";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
// import EmotionCard from "../components/EmotionCard";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { ThemeProvider } from "@emotion/react";
import mainTheme from "../themes/Theme";
import Button from "@mui/material/Button";
import Cards from "../components/Cards";
import Notes from "../components/Notes";
import Summary from "../components/Summary";
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
// import { getStudentLatestEmotion } from "../functions/query";
import useAuth from "../hooks/useAuth";
import { db } from "../config/firebase";
import StudentPrompt from "../components/StudentPrompt";
import Favorites from "./Favorites";
import AddFavoriteCardDialog from "../components/AddFavoriteCardDialog";
import Ranking from "./Ranking";

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function Student() {
    const { studentId } = useParams();
    const favoriteCardsCount = useRef<number | null>(null);
    const [studentInfo, setStudentInfo] = useState<DocumentData | null>(null);
    const [tabValue, setTabValue] = useState(1);
    const [deleteStudentModal, setDeleteStudentModal] = useState(false); // Modify if multiple guardians
    const guardianId = useAuth().currentUser?.uid;
    const [addFavoriteCardDialog, setAddFavoriteCardDialog] = useState(false);

    // useEffect(() => {
    //     const documentRef = doc(db, 'prompt', studentId as string);

    //     const unsubscribe = onSnapshot(documentRef, (docSnapshot) => {
    //         if (docSnapshot.exists()) {
    //             setStudentPrompts(docSnapshot.data());
    //             console.log(docSnapshot.data())
    //         } else {
    //             setStudentPrompts({});
    //         }
    //     }, (error) => {
    //         alert(error);
    //     });

    //     return () => unsubscribe();
    // }, [studentId]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const deleteStudent = async () => {
        try {
            await removeStudent(guardianId as string, studentId as string);
        } catch (error) {
            alert(error)
        }
        window.location.href = '/Home';
    }

    useEffect(() => {
        const fetchStudentInfo = async () => {
            try {
                const studInfo = await getStudentInfo(studentId as string);
                setStudentInfo(studInfo);
            } catch (error) {
                alert(error);
            }
        };

        if (studentId) {
            fetchStudentInfo();
        } else {
            alert("No student ID provided");
        }

    }, [studentId]);

    useEffect(() => {
        const fetchStudentFavoriteCardsCount = async () => {
            try {
                const newStudentFavoriteCardsCount = await getStudentFavoriteCardsCount(studentId as string);
                favoriteCardsCount.current = newStudentFavoriteCardsCount;
                if (favoriteCardsCount.current < 10) {
                    setAddFavoriteCardDialog(true);
                    setTabValue(0);
                }
            } catch (error) {
                alert(error);
            }
        };
        fetchStudentFavoriteCardsCount();
    }, [studentId]);

    function changeLink() {
        // Select the anchor element by its ID
        const linkElement = document.getElementById('navbar-analytics-button') as HTMLLinkElement;

        // Change the href dynamically
        if (linkElement) {
            linkElement.href = `/Home/Analytics/${studentId}`;
            linkElement.style.visibility = 'visible';
        }

    }

    changeLink();

    return (
        <ThemeProvider theme={mainTheme}>
            <AddFavoriteCardDialog open={addFavoriteCardDialog} setOpen={setAddFavoriteCardDialog} favoriteCardCount={favoriteCardsCount.current as number} studentId={studentId as string} />
            <Dialog
                open={deleteStudentModal}
                onClose={() => setDeleteStudentModal(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    <b>{`Delete Student: ${studentId}`}</b>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete student? This action can not be reversed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteStudentModal(false)} sx={{ backgroundColor: "#c1c1c1" }} variant="contained">Cancel</Button>
                    <Button onClick={deleteStudent} autoFocus color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Box display='flex' flexDirection='column' maxHeight={'75%'} flex={1}
                sx={{
                    padding: '5vh 2vw',
                }}>
                <Box display='flex' flexDirection='row' justifyContent='space-between'
                    sx={{
                        width: '100%',
                    }}>
                    <Box display='flex' flexDirection='column'>
                        <Typography variant="h5" component="h5"
                            sx={{
                                textTransform: "capitalize",
                                fontWeight: 'bold',
                            }}
                        >
                            {studentInfo?.name}
                        </Typography>
                        <Typography variant="h6" component="h6"
                            sx={{
                                mt: '4px'
                            }}
                        >
                            {`Email: ${studentInfo?.email}`}
                        </Typography>
                    </Box>

                </Box>

                <Box display='flex' flexDirection='row' justifyContent='flex-start'
                    sx={{
                        mt: '16px',
                    }}
                >
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example"
                        sx={{
                            border: '1px solid #e8e8e8',
                        }}>

                        <Tab label="Cards" {...a11yProps(1)}
                            sx={{
                                // border: '1px solid #e8e8e8',
                                textTransform: "capitalize",
                            }}
                        />
                        <Tab label="Ranking" {...a11yProps(0)}
                            sx={{
                                // border: '1px solid #e8e8e8',
                                textTransform: "capitalize",
                            }}
                        />
                    </Tabs>
                </Box>

                <Box display='flex' flex={1}
                    sx={{
                        border: '1px solid #e8e8e8',
                        padding: '1%',
                        height: '60%',
                    }}
                >
                    {
                        (() => {
                            switch (tabValue) {
                                case 0:
                                    return <Cards studentId={studentId as string} />
                                case 1:
                                    return <Ranking studentId={studentId as string} />
                                case 2:
                                    return <Notes />
                                default:
                                    return <></>
                            }
                        })()
                    }
                </Box>

                <Box display='flex' justifyContent='flex-end' alignContent='center'
                    sx={{
                        width: '100%',
                        mt: '2vh',
                    }}
                >
                    <Button variant="contained" color="error" sx={{ textTransform: 'capitalize' }} onClick={() => setDeleteStudentModal(true)}>
                        Remove Student
                        <DeleteIcon />
                    </Button>
                </Box>
            </Box>

        </ThemeProvider >
    );
}