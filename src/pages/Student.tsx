import { useParams } from "react-router-dom";
import { getStudentInfo, removeStudent } from "../functions/query";
import { useEffect, useState } from "react";
import { DocumentData } from "firebase/firestore";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EmotionCard from "../components/EmotionCard";
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
import { getStudentLatestEmotion } from "../functions/query";

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

interface StudentProps {
    guardianId: string;
}

export default function Student(props: StudentProps) {
    const { id } = useParams();
    const [studentInfo, setStudentInfo] = useState<DocumentData | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [deleteStudentModal, setDeleteStudentModal] = useState(false); // Modify if multiple guardians
    const [latestEmotion, setLatestEmotion] = useState<object | null>(null);

    useEffect(() => {
        const fetchLatestEmotion = async () => {
            const latestEmotion = await getStudentLatestEmotion(id);
            setLatestEmotion(latestEmotion);
            console.log(latestEmotion)
            console.log(latestEmotion.date.toDate())
        }
        fetchLatestEmotion();
    }, [])

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const deleteStudent = async () => {
        try {
            await removeStudent(props.guardianId, id as string);
        } catch (error) {
            alert(error)
        }
        window.location.href = '/Home';
    }

    useEffect(() => {
        const fetchStudentInfo = async () => {
            try {
                const studInfo = await getStudentInfo(id as string);
                setStudentInfo(studInfo);
            } catch (error) {
                alert(error);
            }
        };

        if (id) {
            fetchStudentInfo();
        } else {
            alert("No student ID provided");
        }

    }, [id]);

    return (
        <ThemeProvider theme={mainTheme}>

            <Dialog
                open={deleteStudentModal}
                onClose={() => setDeleteStudentModal(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    <b>{`Delete Student: ${id}`}</b>
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
                    padding: '5vh 5vw',

                }}
            >
                <Box display='flex' flexDirection='row' justifyContent='space-between'
                    sx={{
                        width: '100%',
                    }}
                >
                    <Box display='flex' flexDirection='column'>
                        <Typography variant="h4" component="div"
                            sx={{
                                textTransform: "capitalize",
                            }}
                        >
                            {studentInfo?.name}
                        </Typography>
                        <Typography variant="h6" component="div"
                            sx={{
                                textTransform: "capitalize",
                                mt: '.5em'
                            }}
                        >
                            {`Student ID: ${studentInfo?.userID}`}
                        </Typography>
                    </Box>

                    <EmotionCard emotionTitle={latestEmotion?.emotion} />
                </Box>

                <Box display='flex' flexDirection='row' justifyContent='flex-start'
                    sx={{
                        mt: '2vh',
                        width: 'min-content'
                    }}
                >
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example"
                        sx={{
                            ml: '20px',
                        }}>
                        <Tab label="Cards" {...a11yProps(0)}
                            sx={{
                                border: '1px solid #e8e8e8',
                                textTransform: "capitalize",
                            }}
                        />
                        <Tab label="Notes" {...a11yProps(1)}
                            sx={{
                                border: '1px solid #e8e8e8',
                                ml: '20px',
                                textTransform: "capitalize",
                            }}
                        />
                        <Tab label="Summary" {...a11yProps(2)}
                            sx={{
                                border: '1px solid #e8e8e8',
                                mx: '20px',
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
                                    return <Cards studentId={id as string} guardianId={props.guardianId as string} />
                                case 1:
                                    return <Notes />
                                case 2:
                                    return <Summary />
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