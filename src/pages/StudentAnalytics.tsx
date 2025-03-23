import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChartData, convertMillisecondsToReadableString, fetchExponentialSmoothingPrediction, filterStudentChartData, getCardIdsFromStudentPromptData, getCurrentlyLearningCard, getPhasesPromptData, getStudentCards, getStudentInfo, getStudentPromptData, PhasePromptMap, SessionPromptMap, StudentCard, StudentInfo } from "../functions/query";
import { ThemeProvider } from "@emotion/react";
import mainTheme from "../themes/Theme";
import LinearProgress from "@mui/material/LinearProgress";
import Card from "@mui/material/Card";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { Timestamp } from "firebase/firestore";
import Skeleton from "@mui/material/Skeleton";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import Button from "@mui/material/Button";
import PageviewOutlinedIcon from '@mui/icons-material/PageviewOutlined';
import Modal from "@mui/material/Modal";
import Backdrop from "@mui/material/Backdrop";
import Fade from "@mui/material/Fade";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Filter1Icon from '@mui/icons-material/Filter1';
import Filter2Icon from '@mui/icons-material/Filter2';
import Filter3Icon from '@mui/icons-material/Filter3';
import Divider from "@mui/material/Divider";
import ButtonGroup from "@mui/material/ButtonGroup";

type PhaseProgressProps = {
    phasesPromptData: PhasePromptMap | null;
    studentCards: Map<string, StudentCard>;
}

const phaseNewColors = [{ bg: '#b6dd8d', text: '#2a3716' }, { bg: '#f4b3ff', text: '#4f0341' }, { bg: '#94ddff', text: '#0e3677' }, { bg: '#fdacaa', text: '#4b0606' }];
const promptPalette = ["#9e7cff", "#6c8dff", "#aae173", "#fcc260", "#ff6260", "#6d6262"];


export default function StudentAnalytics() {
    const { studentId } = useParams();
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
    const [phasesPromptData, setPhasesPromptData] = useState<PhasePromptMap | null>(null);
    const [studentCards, setStudentCards] = useState<Map<string, StudentCard>>();

    // hacky
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

    useEffect(() => {
        const fetchStudentName = async () => {
            try {
                const newStudentInfo = await getStudentInfo(studentId as string);
                setStudentInfo(newStudentInfo);
            } catch (error) {
                console.error("Error fetching student info:", error);
            }
        };

        fetchStudentName();
    }, [studentId]);

    useEffect(() => {
        const fetchPhasePromptData = async () => {
            try {
                const newPhasePromptData = await getPhasesPromptData(studentId as string);
                setPhasesPromptData(newPhasePromptData);
            } catch (error) {
                console.error("Error fetching student prompts:", error);
            }
        };

        const fetchStudentCards = async () => {
            const fetchedStudentCards = await getStudentCards(studentId as string);
            setStudentCards(fetchedStudentCards);
        };

        fetchPhasePromptData();
        fetchStudentCards();
    }, [studentId]);

    return (
        <>
            {studentInfo ?
                <Box gap={3}
                    sx={{
                        m: 6,
                        boxSizing: 'border-box',
                    }}>

                    <Typography variant='h4' component='h4'>{`${studentInfo?.name}'s Analytics Overview`}</Typography>
                    <Typography variant='h5' component='h5' mt={1}>{`Phase: ${studentInfo?.phase}`}</Typography>

                    <Box mt={3}
                        sx={{
                            display: 'grid',
                            gridTemplateRows: 'auto min-content',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            rowGap: 2,
                            columnGap: 3,
                            gridAutoFlow: 'column',
                        }}>
                        <PhaseProgress phasesPromptData={phasesPromptData as PhasePromptMap} studentCards={studentCards as Map<string, StudentCard>} />

                        <CurrentlyLearningCard studentId={studentId as string} phasePromptData={phasesPromptData} />

                    </Box>

                    <Box mt={4}>
                        <ViewPrompts studentInfo={studentInfo as StudentInfo} studentCards={studentCards as Map<string, StudentCard>} phasePromptData={phasesPromptData} />
                    </Box>

                </Box>

                :
                <ThemeProvider theme={mainTheme}>
                    <LinearProgress color="secondary" />
                </ThemeProvider>
            }
        </>
    )
}

type PhasePrediction = {
    phase: string;
    estimatedSum: number;
};

function PhaseProgress({ phasesPromptData, studentCards }: PhaseProgressProps) {
    const [phasePredictionsSES, setPhasePredictionsSES] = useState<PhasePrediction[]>([]);
    const [openPhaseModal, setOpenPhaseModal] = useState<string | null>(null);

    const handleOpenPhaseModal = (phase: string) => {
        setOpenPhaseModal(phase);
    };
    const handleClosePhaseModal = () => {
        setOpenPhaseModal(null);
    };

    const phaseCards = useMemo(() => { /* eslint-disable */
        if (!studentCards) return [];

        return ['1', '2', '3'].map((phase) => {
            const filteredCards = Array.from(studentCards.entries())
                .filter(([_, card]) => {
                    switch (phase) {
                        case '2':
                            // Include cards that are not in the 'Emotions' category for phase 2
                            return card.category !== 'Emotions';
                        case '3':
                            // Include cards that are in the 'Emotions' category for phase 3
                            return card.category === 'Emotions';
                        default:
                            // Include all cards by default
                            return true;
                    }
                })
                .map(([_, card]) => card); // Extract only the card objects

            return { phase, cards: filteredCards };
        });
    }, [studentCards]); /* eslint-enable */

    const independentPhaseCards = useMemo(() => {
        return phaseCards.map(({ phase, cards }) => {
            const independentCards = cards.filter((card) => {
                switch (phase) {
                    case '1':
                        return card.phase1_independence === true;
                    case '2':
                        return card.phase2_independence === true;
                    case '3':
                        return card.phase3_independence === true;
                    default:
                        console.error('Invalid phase');
                        return false;
                }
            });

            return { phase, independentCards };
        });
    }, [phaseCards]);

    const phasesDuration = useMemo(() => {
        if (!phasesPromptData) return [];
        return Array.from(phasesPromptData.entries()).map(([phaseId, phase]) => {
            const entryTimestamps: Timestamp[] = phase.entryTimestamps as Timestamp[];
            const exitTimestamps: Timestamp[] = phase.exitTimestamps as Timestamp[];
            if (!entryTimestamps) return { label: phaseId, value: 0 };

            // Ensure exitTimestamps has a matching length
            const adjustedExitTimestamps = exitTimestamps ? [...exitTimestamps] : [];
            if (entryTimestamps.length > adjustedExitTimestamps.length) {
                adjustedExitTimestamps.push(Timestamp.now());
            }

            // Calculate total duration
            const totalDuration = entryTimestamps.reduce((sum, entryTimestamp, index) => {
                const exitTimestamp = adjustedExitTimestamps[index];
                return sum + (exitTimestamp.toMillis() - entryTimestamp.toMillis());
            }, 0);

            return { label: phaseId, value: totalDuration };
        });
    }, [phasesPromptData]);

    const averagePhaseCardIndependenceTime = useMemo(() => {
        const phaseAverageTimes: { phase: string, averageCardTime: number }[] = [];

        phasesDuration.forEach((phase) => {
            const independentCardsTimestamp = new Map<string, { firstInstance: Timestamp, completion: Timestamp }>();

            phasesPromptData?.get(phase.label)?.session.forEach((sessionPrompt) => {
                sessionPrompt.trialPrompt.forEach((trialPrompt) => {
                    const { cardID, timestamp } = trialPrompt;
                    const existingInstance = independentCardsTimestamp.get(cardID);
                    let completionTimestamp: Timestamp | undefined = undefined;
                    switch (phase.label) {
                        case '1':
                            completionTimestamp = studentCards.get(cardID)?.phase1_completion;
                            break;
                        case '2':
                            completionTimestamp = studentCards.get(cardID)?.phase2_completion;
                            break;
                        case '3':
                            completionTimestamp = studentCards.get(cardID)?.phase3_completion;
                            break;
                        default:
                            break;
                    }

                    if (completionTimestamp) {
                        if (existingInstance) {
                            if (timestamp.toMillis() < existingInstance.firstInstance.toMillis()) {
                                existingInstance.firstInstance = timestamp;
                            }
                        } else {
                            independentCardsTimestamp.set(cardID, { firstInstance: timestamp, completion: completionTimestamp });
                        }
                    }
                });
            });

            const averageSingleCardIndependenceTime = Array.from(independentCardsTimestamp.values()).reduce((sum, instance) => {
                const timeDifference = instance.completion.toMillis() - instance.firstInstance.toMillis();
                return sum + timeDifference;
            }, 0) / (independentCardsTimestamp.size || 1); // Avoid division by zero

            phaseAverageTimes.push({ phase: phase.label, averageCardTime: averageSingleCardIndependenceTime });
        });

        return phaseAverageTimes;
    }, [phasesDuration, phasesPromptData, studentCards]);

    const completionDataArray = useMemo(() => {
        const completionData: { phase: string, completionDate: Date, timeTakenIndependence: number }[] = [];

        phasesDuration.forEach((phase) => {
            const independentCardsTimestamp = new Map<string, { firstInstance: Timestamp, completion: Timestamp }>();

            phasesPromptData?.get(phase.label)?.session.forEach((sessionPrompt) => {
                sessionPrompt.trialPrompt.forEach((trialPrompt) => {
                    const { cardID, timestamp } = trialPrompt;
                    const existingInstance = independentCardsTimestamp.get(cardID);
                    let completionTimestamp: Timestamp | undefined = undefined;
                    switch (phase.label) {
                        case '1':
                            completionTimestamp = studentCards.get(cardID)?.phase1_completion;
                            break;
                        case '2':
                            completionTimestamp = studentCards.get(cardID)?.phase2_completion;
                            break;
                        case '3':
                            completionTimestamp = studentCards.get(cardID)?.phase3_completion;
                            break;
                        default:
                            break;
                    }

                    if (completionTimestamp) {
                        if (existingInstance) {
                            if (timestamp.toMillis() < existingInstance.firstInstance.toMillis()) {
                                existingInstance.firstInstance = timestamp;
                            }
                        } else {
                            independentCardsTimestamp.set(cardID, { firstInstance: timestamp, completion: completionTimestamp });
                        }
                    }
                });
            });

            Array.from(independentCardsTimestamp.values()).forEach((instance) => {
                const timeTakenIndependence = instance.completion.toMillis() - instance.firstInstance.toMillis();
                completionData.push({
                    phase: phase.label,
                    completionDate: new Date(instance.completion.toMillis()),
                    timeTakenIndependence: timeTakenIndependence,
                });
            });
        });

        // Sort by ascending completion date
        completionData.sort((a, b) => a.completionDate.getTime() - b.completionDate.getTime());

        return completionData;
    }, [phasesDuration, phasesPromptData, studentCards]);

    useEffect(() => {
        const fetchPhasePredictionsSES = async () => {
            const predictions = await Promise.all(
                phasesDuration.map(async (phase) => {
                    const proficientCards = (independentPhaseCards.find((element) => element.phase === phase.label)?.independentCards.length || 0);
                    const totalCards = phaseCards.find((element) => element.phase === phase.label)?.cards.length || 0;
                    const prediction = await fetchExponentialSmoothingPrediction(
                        completionDataArray.filter((element) => element.phase === phase.label),
                        proficientCards,
                        totalCards
                    );
                    return { phase: phase.label, estimatedSum: prediction };
                })
            );
            console.log(JSON.stringify(predictions));
            setPhasePredictionsSES(predictions);
        };

        fetchPhasePredictionsSES();
    }, [completionDataArray, phasesDuration, phaseCards, independentPhaseCards]);


    const requiredPhases = ['1', '2', '3'];
    const missingPhases = requiredPhases.filter(phase => !phasesDuration.some(p => p.label === phase));
    const completePhasesDuration = phasesDuration.concat(missingPhases.map(phase => ({ label: phase, value: 0 })));


    return (
        <>
            {phasesPromptData && phasePredictionsSES ?
                <>
                    {completePhasesDuration.filter(phase => phase.label !== '4').map((phase) => (
                        <>
                            <Card elevation={4} key={`phase-progress-main-${phase.label}`}
                                sx={{
                                    p: 1,
                                }}>
                                <Typography variant='h6' component='h6' sx={{ textAlign: 'center' }}>{`Phase ${phase.label}`}</Typography>
                                <MuiGauge value=
                                    {(phaseCards.find((element) => element.phase === phase.label)?.cards.length) ?
                                        (
                                            (independentPhaseCards.find((element) => element.phase === phase.label)?.independentCards.length || 0) /
                                            (phaseCards.find((element) => element.phase === phase.label)?.cards.length || 1)
                                            * 100
                                        )
                                        : 0}
                                    fill={phaseNewColors[parseInt(phase.label) - 1].bg} />
                                <Typography variant='body1' mt={1} mx={2}>
                                    Estimated time to finish: <strong>~
                                        {(() => {
                                            const prediction = phasePredictionsSES.find(prediction => prediction.phase === phase.label);
                                            if (prediction && prediction.estimatedSum > 0) {
                                                return convertMillisecondsToReadableString(prediction.estimatedSum);
                                            }
                                            return 'Need more sessions';
                                        })()}
                                    </strong>
                                </Typography>
                            </Card>
                            <Card elevation={4} key={`phase-progress-desc-${phase.label}`}
                                sx={{
                                    p: 1,
                                    height: 'auto',
                                    // textAlign: 'end'
                                }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', mb: 2 }}>
                                    <ThemeProvider theme={mainTheme}>
                                        <Button variant="contained" color="secondary" endIcon={<PageviewOutlinedIcon fontSize="large" />} onClick={() => handleOpenPhaseModal(phase.label)}
                                            sx={{ backgroundColor: phaseNewColors[parseInt(phase.label) - 1].bg, color: phaseNewColors[parseInt(phase.label) - 1].text, fontSize: '1em' }}>
                                            View Phase Cards
                                        </Button>
                                    </ThemeProvider>
                                </Box>
                                <Typography variant='body1' mt={1} mx={2}>No. of Cards: <strong>{(phaseCards.find((element) => element.phase === phase.label)?.cards.length || 0)}</strong></Typography>
                                <Typography variant='body1' mt={1} mx={2}>No. of Proficient Cards: <strong>{(independentPhaseCards.find((element) => element.phase === phase.label)?.independentCards.length || 0)}</strong></Typography>
                                <Typography variant='body1' mt={1} mx={2}>Time Spent in Phase: <strong>{convertMillisecondsToReadableString(phasesDuration.find((element) => element.label === phase.label)?.value as number) || '0'}</strong></Typography>
                                <Typography variant='body1' mt={1} mx={2}>Avg. Time for Card Proficiency: <strong>{convertMillisecondsToReadableString(averagePhaseCardIndependenceTime.find((element) => element.phase === phase.label)?.averageCardTime as number) || 'Needs more sessions'}</strong></Typography>
                            </Card>
                        </>
                    ))}
                    {openPhaseModal && (
                        <PhaseTransitionsModal
                            openPhaseModal={!!openPhaseModal}
                            phase={openPhaseModal}
                            phaseCards={new Map(phaseCards.find((element) => element.phase === openPhaseModal)?.cards.map(card => [card.cardId, card])) as Map<string, StudentCard>}
                            handleClosePhaseModal={handleClosePhaseModal}
                        />
                    )}

                </>
                : <>
                    {[1, 2, 3].map(() => (
                        <>
                            <Skeleton variant="rectangular" height={'100%'} />
                            <Box>
                                <Skeleton />
                                <Skeleton width="60%" />
                            </Box>
                        </>
                    ))}
                </>
            }
        </>

    )
}

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    height: '75vh',
    width: '75vw',
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 12,
    p: 4,
    overflowY: 'auto',
};

type PhaseTransitionsModalProps = {
    openPhaseModal: boolean;
    phase: string;
    phaseCards: Map<string, StudentCard>;
    handleClosePhaseModal: () => void;
};

function PhaseTransitionsModal({ openPhaseModal, phase, phaseCards, handleClosePhaseModal }: PhaseTransitionsModalProps) {
    const [phaseCardFiltered, setPhaseCardFiltered] = useState<{
        learning: [string, StudentCard][];
        completed: [string, StudentCard][];
        future: [string, StudentCard][];
    }>({
        learning: [],
        completed: [],
        future: [],
    });

    useEffect(() => {
        let learningPhaseFiltered: [string, StudentCard][] = [];
        switch (phase) {
            case '1':
                learningPhaseFiltered = Array.from(phaseCards.entries()).filter(([key, value]) =>
                    value.phase1_independence === false);
                break;
            case '2':
                learningPhaseFiltered = Array.from(phaseCards.entries()).filter(([key, value]) =>
                    value.category !== 'Emotions' &&
                    value.phase1_independence === true &&
                    value.phase2_independence === false);
                break;
            case '3':
                learningPhaseFiltered = Array.from(phaseCards.entries()).filter(([key, value]) =>
                    value.category === 'Emotions' &&
                    value.phase1_independence === true &&
                    value.phase3_independence === false);
                break;
            default:
                break;
        }
        setPhaseCardFiltered((prev) => ({ ...prev, learning: learningPhaseFiltered }));
    }, [phaseCards, phase]);

    const learningPhaseCards = useMemo(() => {
        return phaseCardFiltered.learning.map(([key, value]) =>
        (
            <Card key={key} data-category-type={value.category} sx={{ minHeight: '25vh', maxHeight: '25vh', m: '5%' }}>
                <CardMedia
                    sx={{ height: '15vh', width: '100%', objectFit: 'contain' }}
                    image={value.imageUrl}
                    title={value.title}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography gutterBottom variant="h5" component="h5" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textWrap: 'nowrap'
                    }}>
                        {value.title}
                    </Typography>
                    <Box>
                        {value.phase1_independence ? <Filter1Icon sx={{ color: phaseNewColors[0].bg }} /> : null}
                        {value.phase2_independence && phase == '2' ? <Filter2Icon sx={{ color: phaseNewColors[1].bg }} /> : null}
                        {value.phase3_independence && phase == '3' ? <Filter3Icon sx={{ color: phaseNewColors[2].bg }} /> : null}
                    </Box>
                </CardContent>
            </Card>
        )
        );
    }, [phaseCardFiltered.learning]);

    useEffect(() => {
        let completedPhaseFiltered: [string, StudentCard][] = [];
        switch (phase) {
            case '1':
                completedPhaseFiltered = Array.from(phaseCards.entries()).filter(([key, value]) =>
                    value.phase1_independence === true);
                break;
            case '2':
                completedPhaseFiltered = Array.from(phaseCards.entries()).filter(([key, value]) =>
                    value.category !== 'Emotions' &&
                    value.phase2_independence === true);
                break;
            case '3':
                completedPhaseFiltered = Array.from(phaseCards.entries()).filter(([key, value]) =>
                    value.category === 'Emotions' &&
                    value.phase3_independence === true);
                break;
            default:
                break;
        }
        setPhaseCardFiltered((prev) => ({ ...prev, completed: completedPhaseFiltered }));
    }, [phaseCards, phase]);

    const completedPhaseCards = useMemo(() => {
        return phaseCardFiltered.completed.map(([key, value]) =>
        (
            <Card key={key} data-category-type={value.category} sx={{ minHeight: '25vh', maxHeight: '25vh', m: '5%' }}>
                <CardMedia
                    sx={{ height: '15vh', width: '100%', objectFit: 'contain' }}
                    image={value.imageUrl}
                    title={value.title}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography gutterBottom variant="h5" component="h5" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textWrap: 'nowrap'
                    }}>
                        {value.title}
                    </Typography>
                    <Box>
                        {value.phase1_independence ? <Filter1Icon sx={{ color: phaseNewColors[0].bg }} /> : null}
                        {value.phase2_independence && phase == '2' ? <Filter2Icon sx={{ color: phaseNewColors[1].bg }} /> : null}
                        {value.phase3_independence && phase == '3' ? <Filter3Icon sx={{ color: phaseNewColors[2].bg }} /> : null}
                    </Box>
                </CardContent>
            </Card>
        )
        );
    }, [phaseCardFiltered.completed]);

    useEffect(() => {
        let futurePhaseFiltered: [string, StudentCard][] = [];
        switch (phase) {
            case '1':
                break;
            case '2':
                futurePhaseFiltered = Array.from(phaseCards.entries()).filter(([key, value]) =>
                    value.category !== 'Emotions' &&
                    value.phase1_independence === false);
                break;
            case '3':
                futurePhaseFiltered = Array.from(phaseCards.entries()).filter(([key, value]) =>
                    value.category === 'Emotions' &&
                    value.phase1_independence === false);
                break;
            default:
                break;
        }
        setPhaseCardFiltered((prev) => ({ ...prev, future: futurePhaseFiltered }));
    }, [phaseCards, phase]);

    const futurePhaseCards = useMemo(() => {
        return phaseCardFiltered.future.map(([key, value]) =>
        (
            <Card key={key} data-category-type={value.category} sx={{ minHeight: '25vh', maxHeight: '25vh', m: '5%' }}>
                <CardMedia
                    sx={{ height: '15vh', width: '100%', objectFit: 'contain' }}
                    image={value.imageUrl}
                    title={value.title}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography gutterBottom variant="h5" component="h5" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textWrap: 'nowrap'
                    }}>
                        {value.title}
                    </Typography>
                    <Box>
                        {value.phase1_independence ? <Filter1Icon sx={{ color: phaseNewColors[0].bg }} /> : null}
                        {value.phase2_independence && phase == '2' ? <Filter2Icon sx={{ color: phaseNewColors[1].bg }} /> : null}
                        {value.phase3_independence && phase == '3' ? <Filter3Icon sx={{ color: phaseNewColors[2].bg }} /> : null}
                    </Box>
                </CardContent>
            </Card>
        )
        );
    }, [phaseCardFiltered.future]);

    return (
        <div>
            <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
                open={openPhaseModal}
                onClose={handleClosePhaseModal}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                }}
            >
                <Fade in={openPhaseModal}>
                    <Box sx={style}>
                        <Typography id="transition-modal-title" variant="h4" component="h4">
                            Phase {phase}
                        </Typography>

                        <Box>
                            <Divider />
                            <Typography variant="h6" component="h6" mt={2}>
                                Currently Learning Cards
                            </Typography>
                            <Box
                                display="grid"
                                gridTemplateColumns="repeat(4, 1fr)"
                                sx={{
                                    mt: '1%',
                                    height: '100%',
                                    width: '100%',
                                    overflowX: 'hidden',
                                    overflowY: 'auto',
                                }}
                            >
                                {learningPhaseCards as React.ReactNode[]}
                            </Box>
                        </Box>

                        <Box>
                            <Divider />
                            <Typography variant="h6" component="h6" mt={2}>
                                Completed Cards
                            </Typography>
                            <Box
                                display="grid"
                                gridTemplateColumns="repeat(4, 1fr)"
                                sx={{
                                    mt: '1%',
                                    height: '100%',
                                    width: '100%',
                                    overflowX: 'hidden',
                                    overflowY: 'auto',
                                }}
                            >
                                {completedPhaseCards}
                            </Box>
                        </Box>

                        {phase !== '1' && (
                            <Box>
                                <Divider />
                                <Typography variant="h6" component="h6" mt={2}>
                                    Future Cards
                                </Typography>
                                <Box
                                    display="grid"
                                    gridTemplateColumns="repeat(4, 1fr)"
                                    sx={{
                                        mt: '1%',
                                        height: '100%',
                                        width: '100%',
                                        overflowX: 'hidden',
                                        overflowY: 'auto',
                                    }}
                                >
                                    {futurePhaseCards}
                                </Box>
                            </Box>
                        )}

                    </Box>
                </Fade>
            </Modal>
        </div>
    );
}

function MuiGauge({ value, fill }: { value: number, fill: string }) {
    return (
        <Gauge
            value={value}
            startAngle={0}
            endAngle={360}
            innerRadius="80%"
            outerRadius="100%"
            height={150}
            sx={{
                [`& .${gaugeClasses.valueText}`]: {
                    fontFamily: 'Roboto',
                    fontSize: '1.5em',
                    fontWeight: 500,
                },
                [`& .${gaugeClasses.valueArc}`]: {
                    fill: fill,
                },
            }}
            text={
                ({ value }) => `${value?.toFixed(2).replace(/\.00$/, '')}%`
            }
        />
    );
}

function CurrentlyLearningCard({ studentId, phasePromptData }: { studentId: string, phasePromptData: PhasePromptMap | null }) {
    const [currentlyLearningCards, setCurrentlyLearningCards] = useState<{
        '1': StudentCard | undefined | null;
        '2': StudentCard | undefined | null;
        '3': StudentCard | undefined | null;
    }>({
        '1': undefined,
        '2': undefined,
        '3': undefined,
    });

    const [selectedPhase, setSelectedPhase] = useState<'1' | '2' | '3'>('1');

    useEffect(() => {
        const fetchCurrentlyLearningCards = async () => {
            try {
                phasePromptData?.forEach(async (value, key) => {
                    const newCurrentlyLearningCard = await getCurrentlyLearningCard(studentId as string, key as string);
                    setCurrentlyLearningCards(prev => ({ ...prev, [key]: newCurrentlyLearningCard.card }));
                }
                );
            } catch (error) {
                console.error("Error fetching student card:", error);
                setCurrentlyLearningCards({
                    '1': null,
                    '2': null,
                    '3': null,
                });
            }
        };
        fetchCurrentlyLearningCards();
    }, [phasePromptData, studentId]);

    return (
        <>
            {currentlyLearningCards ?
                <Box sx={{ gridRow: '1/3', gridColumn: '4/5' }}>
                    <Card elevation={4}
                        sx={{
                            p: 1,
                            boxSizing: 'border-box',
                            height: '100%'
                        }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', my: 2, whiteSpace: 'nowrap', }}>
                            <ButtonGroup variant="contained" aria-label="Basic button group">
                                {Array.from(phasePromptData?.keys() || []).filter(phase => phase !== '4').map((element, index) => (
                                    <Button key={element} onClick={() => setSelectedPhase(element as '1' | '2' | '3')}
                                        sx={{ backgroundColor: phaseNewColors[index].bg, color: phaseNewColors[index].text, fontSize: '1em' }}>
                                        {`Phase ${element}`}
                                    </Button>
                                ))}
                            </ButtonGroup>
                        </Box>
                        <Typography variant='h6' component='h6' sx={{ textAlign: 'center' }}>Currently Learning</Typography>
                        <Box sx={{ minHeight: '100' }}>
                            <img src={currentlyLearningCards[selectedPhase]?.imageUrl} alt={currentlyLearningCards[selectedPhase]?.title}
                                style={{
                                    display: 'block',
                                    margin: '4px auto',
                                    objectFit: 'contain',
                                    // height: '10em',
                                    width: '10em',
                                }} />
                            <Typography variant='body1' mt={1} mx={2}>Title: {currentlyLearningCards[selectedPhase]?.title}</Typography>
                            <Typography variant='body1' mt={1} mx={2}>Category: {currentlyLearningCards[selectedPhase]?.category}</Typography>
                        </Box>
                    </Card>
                </Box>
                : currentlyLearningCards === undefined ?
                    <>
                        <Skeleton variant="rectangular" height={'100%'} />
                        <Box>
                            <Skeleton />
                            <Skeleton width="60%" />
                        </Box>
                    </>
                    : <></>
            }
        </>
    );
}

function ViewPrompts({ studentInfo, studentCards, phasePromptData }: { studentInfo: StudentInfo, studentCards: Map<string, StudentCard>, phasePromptData: PhasePromptMap | null }) {
    const [promptFilter, setPromptFilter] = useState<{ phase: string, cardID: string, startDate: Date | undefined, endDate: Date | undefined }>({
        phase: "All",
        cardID: "All",
        startDate: undefined,
        endDate: undefined,
    });
    const [startDatecleared, setStartDateCleared] = useState<boolean>(false);
    const [endDatecleared, setEndDateCleared] = useState<boolean>(false);
    const [studentPromptsCard, setStudentPromptsCard] = useState<string[]>([]);


    const handlePromptFilterChange = ({ phase, cardID, startDate, endDate }: { phase: string, cardID: string, startDate: Date | undefined, endDate: Date | undefined }) => {
        setPromptFilter({ phase, cardID, startDate, endDate });
    };

    const handleStartDateChange = (value: dayjs.Dayjs | null) => {
        if (value) {
            const jsDate = value.toDate();
            // setPromptFilter({ ...promptFilter, startDate: jsDate });
            setPromptFilter(prevFilter => {
                const updatedFilter = { ...prevFilter, startDate: jsDate };

                if (prevFilter.endDate === undefined) {
                    updatedFilter.endDate = jsDate;
                }
                return updatedFilter;
            });
        } else {
            setPromptFilter({ ...promptFilter, startDate: undefined });
        }
    };

    const handleEndDateChange = (value: dayjs.Dayjs | null) => {
        if (value) {
            // Convert dayjs object to JavaScript Date
            const jsDate = value.toDate();
            setPromptFilter({ ...promptFilter, endDate: jsDate });
        } else {
            setPromptFilter({ ...promptFilter, endDate: undefined });
        }
    };

    useEffect(() => {
        if (startDatecleared) {
            const timeout = setTimeout(() => {
                setStartDateCleared(false);
            }, 1500);

            return () => clearTimeout(timeout);
        }
        return () => { };
    }, [startDatecleared]);

    useEffect(() => {
        if (endDatecleared) {
            const timeout = setTimeout(() => {
                setEndDateCleared(false);
            }, 1500);

            return () => clearTimeout(timeout);
        }
        return () => { };
    }, [endDatecleared]);


    // useEffect(() => {
    //     const fetchStudentPromptData = async () => {
    //         try {
    //             const newStudentPrompts = await getStudentPromptData(studentInfo.userID as string, String(studentInfo.phase));
    //             setStudentPromptsData(newStudentPrompts);
    //             setStudentPromptsCard(getCardIdsFromStudentPromptData(newStudentPrompts));
    //         } catch (error) {
    //             console.error("Error fetching student prompts:", error);
    //         }
    //     };
    //     fetchStudentPromptData();
    // }, [studentInfo.userID, studentInfo.phase]);

    useEffect(() => {
        const newStudentCards = getCardIdsFromStudentPromptData(phasePromptData);
        setStudentPromptsCard(newStudentCards);
    }, [phasePromptData, promptFilter.phase]);

    const studentPromptsChart = useMemo(
        () =>
            filterStudentChartData(phasePromptData, promptFilter.phase as string, promptFilter.cardID as string, promptFilter.startDate, promptFilter.endDate)
        , [phasePromptData, promptFilter.phase, promptFilter.cardID, promptFilter.startDate, promptFilter.endDate]);

    // const [studentPromptsChart, setStudentPromptsChart] = useState<ChartData | null>(null);
    // useEffect(() => {
    //     const filteredStudentPromptsChart = filterStudentChartData(studentPromptsData, promptFilter.cardID as string, promptFilter.startDate, promptFilter.endDate);
    //     setStudentPromptsChart(filteredStudentPromptsChart);
    // }, [studentPromptsData, promptFilter.cardID, promptFilter.startDate, promptFilter.endDate]);

    const inputArrays =
    {
        Independent: studentPromptsChart?.independentArray || [],
        Verbal: studentPromptsChart?.verbalArray || [],
        Gestural: studentPromptsChart?.gesturalArray || [],
        Modeling: studentPromptsChart?.modelingArray || [],
        Physical: studentPromptsChart?.physicalArray || [],
        ...((promptFilter.phase === "1" || promptFilter.phase === "All") && { IndependentWrong: studentPromptsChart?.independentWrongArray || [] }),
    }

    function calculatePercentages(arrays: { [key: string]: number[] }): { label: string; value: number }[] {
        const totalSum = Object.values(arrays).reduce((sum, arr) => sum + arr.reduce((a, b) => a + b, 0), 0);

        return Object.entries(arrays).map(([label, values]) => {
            const sum = values.reduce((a, b) => a + b, 0);
            const percentage = totalSum > 0 ? (sum / totalSum) * 100 : 0; // Calculate percentage
            return { label, value: Number(percentage.toFixed(2)) }; // Format to two decimal places
        });
    }

    const percentagesData = calculatePercentages(inputArrays);

    return (
        <Box gap={3}
            sx={{
                display: 'flex',
                width: '100%',
                boxSizing: 'border-box',
                mb: 3,
            }}>
            <Card
                elevation={4}
                sx={{
                    p: 1,
                    flex: 1,
                }}>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }} mt={2} mx={2}>
                    <Typography variant='h4' component='h4' >{`Prompts`}</Typography>
                    <Box sx={{ minWidth: 320, display: 'flex', gap: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel id="demo-simple-select-label-phase">Phase</InputLabel>
                            <Select
                                labelId="demo-simple-select-label-phase"
                                id="demo-simple-select-phase"
                                value={promptFilter.phase as string}
                                label="Phase Filter"
                                onChange={(event: SelectChangeEvent) => handlePromptFilterChange({ ...promptFilter, phase: event.target.value as string })}
                            >
                                <MenuItem value={"All"}>All</MenuItem>
                                {Array.from(phasePromptData?.keys() || []).map((element) => (
                                    <MenuItem key={element} value={element}>
                                        {element}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel id="demo-simple-select-label-card">Card</InputLabel>
                            <Select
                                labelId="demo-simple-select-label-card"
                                id="demo-simple-select-card"
                                value={promptFilter.cardID as string}
                                label="Card Filter"
                                onChange={(event: SelectChangeEvent) => handlePromptFilterChange({ ...promptFilter, cardID: event.target.value as string })}
                            >
                                <MenuItem value={"All"}>All</MenuItem>
                                {studentPromptsCard.map((cardID) => (
                                    <MenuItem key={cardID} value={cardID}>
                                        {studentCards.get(cardID)?.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <DatePicker label="Start Date" format="LL" sx={{ width: '150%' }} value={promptFilter.startDate ? dayjs(promptFilter.startDate) : null} onChange={handleStartDateChange}
                            slotProps={{
                                field: { clearable: true, onClear: () => setStartDateCleared(true) },
                            }} />
                        <DatePicker label="End Date" format="LL" sx={{ width: '150%' }} value={promptFilter.endDate ? dayjs(promptFilter.endDate) : null} onChange={handleEndDateChange}
                            slotProps={{
                                field: { clearable: true, onClear: () => setEndDateCleared(true) },
                            }} />
                    </Box>
                </Box>

                <LineChart
                    colors={promptPalette}
                    xAxis={[{ scaleType: 'band', data: studentPromptsChart?.dateArray || [] }]}
                    series={[
                        { data: studentPromptsChart?.physicalArray || [], label: 'Physical', },
                        { data: studentPromptsChart?.modelingArray || [], label: 'Modeling', },
                        { data: studentPromptsChart?.gesturalArray || [], label: 'Gestural', },
                        { data: studentPromptsChart?.verbalArray || [], label: 'Verbal', },
                        { data: studentPromptsChart?.independentArray || [], label: 'Independent', },
                        ...((promptFilter.phase === "1" || promptFilter.phase === "All") ? [{ data: studentPromptsChart?.independentWrongArray || [], label: 'IndependentWrong', }] : []),

                    ]}
                    height={400}
                    grid={{ vertical: true, horizontal: true }}
                />
            </Card>

            <Card
                elevation={4}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 2,
                    overflowX: 'auto',
                    width: 'min-content'
                }}
            >
                <Typography variant='h6' component='h6'>{`Prompts Distribution`}</Typography>
                <PieChart
                    colors={promptPalette}
                    series={[
                        {
                            data: percentagesData,
                            highlightScope: { fade: 'global', highlight: 'item' },
                            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                        },
                    ]}
                    slotProps={{
                        legend: {
                            hidden: true,
                        }
                    }}
                    sx={{
                        mr: -10,
                    }}
                    height={200} width={270}
                />
            </Card>
        </Box>
    );
}