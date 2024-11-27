import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { convertMillisecondsToReadableString, fetchExponentialSmoothingPrediction, filterStudentChartData, getCardIdsFromStudentPromptData, getCurrentlyLearningCard, getPhasesPromptData, getStudentCards, getStudentInfo, getStudentPromptData, PhasePromptMap, SessionPromptMap, StudentCard, StudentInfo } from "../functions/query";
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

type PhaseProgressProps = {
    phasesPromptData: PhasePromptMap | null;
    studentCards: Map<string, StudentCard>;
}

const phaseNewColors = [{ bg: '#b6dd8d', text: '#2a3716' }, { bg: '#f4b3ff', text: '#4f0341' }, { bg: '#94ddff', text: '#0e3677' }, { bg: '#fdacaa', text: '#4b0606' }];
const promptPalette = ["#ff6260", "#fcc260", "#aae173", "#6c8dff", "#9e7cff"];


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

                        <CurrentlyLearningCard studentId={ studentId as string} phase={studentInfo.phase.toString()} phasePromptData={phasesPromptData}/>

                    </Box>

                    <Box mt={4}>
                        <ViewPrompts studentInfo={studentInfo as StudentInfo} studentCards={studentCards as Map<string, StudentCard>} />
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

function PhaseProgress({ phasesPromptData, studentCards }: PhaseProgressProps) {
    const [phasePredictionsSES, setPhasePredictionsSES] = useState<{
        phase: string;
        estimatedSum: number; // in milliseconds
    }[]>([]);

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
                            if (timestamp.toMillis() > existingInstance.completion.toMillis()) {
                                existingInstance.completion = timestamp;
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
                            if (timestamp.toMillis() > existingInstance.completion.toMillis()) {
                                existingInstance.completion = timestamp;
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
                        completionDataArray.filter((element) => element.phase === phase.label ),
                        proficientCards,
                        totalCards
                    );
                    return { phase: phase.label, estimatedSum: prediction };
                })
            );
            setPhasePredictionsSES(predictions);
        };

        fetchPhasePredictionsSES();
    }, [completionDataArray, phasesDuration, phaseCards, independentPhaseCards]);

    return (
        <>
            {phasesPromptData && phasePredictionsSES ?
                <>
                    {phasesDuration.map((phase) => (
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
                                <Typography variant='body1' mt={1} mx={2}>Estimated time to finish: <strong>{(phasePredictionsSES.find(prediction => prediction.phase === phase.label)?.estimatedSum >= 2)
    ? convertMillisecondsToReadableString(phasePredictionsSES.find(prediction => prediction.phase === phase.label)?.estimatedSum || 0) 
    : 'Need more sessions'}</strong></Typography>
                            </Card>
                            <Card elevation={4} key={`phase-progress-desc-${phase.label}`}
                                sx={{
                                    p: 1,
                                    height: 'fit-content',
                                    textAlign: 'end'
                                }}>
                                <Typography variant='body1' mt={1} mx={2}>No. of Cards: <strong>{(phaseCards.find((element) => element.phase === phase.label)?.cards.length || 0)}</strong></Typography>
                                <Typography variant='body1' mt={1} mx={2}>No. of Proficient Cards: <strong>{(independentPhaseCards.find((element) => element.phase === phase.label)?.independentCards.length || 0)}</strong></Typography>
                                <Typography variant='body1' mt={1} mx={2}>Time Spent: <strong>{convertMillisecondsToReadableString(phasesDuration.find((element) => element.label === phase.label)?.value as number)}</strong></Typography>
                                <Typography variant='body1' mt={1} mx={2}>Avg. Time for Card Proficiency: <strong>{convertMillisecondsToReadableString(averagePhaseCardIndependenceTime.find((element) => element.phase === phase.label)?.averageCardTime as number)}</strong></Typography>
                            </Card>
                        </>
                    ))}

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

function CurrentlyLearningCard({studentId, phase, phasePromptData}: {studentId: string, phase: string, phasePromptData: PhasePromptMap | null}) {
    const [currentlyLearningCard, setCurrentlyLearningCard] = useState<StudentCard | null>(null);

    useEffect(() => {
        const fetchCurrentlyLearningCard = async () => {
            try {
                const newCurrentlyLearningCard = await getCurrentlyLearningCard(studentId as string, phase as string);
                setCurrentlyLearningCard(newCurrentlyLearningCard);
            } catch (error) {
                console.error("Error fetching student card:", error);
            }
        }
        fetchCurrentlyLearningCard();
    });

    // const getCardLearningTime = useMemo(() => {
    //     phasePromptData?.forEach((phase) => {
    //         phase.session.forEach((session) => {
    //             session.trialPrompt.forEach((trial) => {
    //                 if (trial.cardID === currentlyLearningCard?.cardID) {
    //                     return trial.timestamp.toMillis();
    //                 }
    //             });
    //         });
    //     }
    // }, []);
    return (
        <>
        { currentlyLearningCard ?
        <Box sx={{ gridRow: '1/3', gridColumn: '4/5' }}>
            <Card elevation={4}
                sx={{
                    p: 1,
                }}>
                <Typography variant='h6' component='h6' sx={{ textAlign: 'center'}}>Currently Learning</Typography>
                <Box sx={{ minHeight:'100'}}>               
                    <img src={currentlyLearningCard.imageUrl} alt={currentlyLearningCard.title} 
                    style={{ 
                        display: 'block',
                        margin: '4px auto',
                        objectFit: 'contain', 
                        // height: '10em',
                        width: '10em',
                        }}/>
                    <Typography variant='body1' mt={1} mx={2}>Title: {currentlyLearningCard.title}</Typography>
                    <Typography variant='body1' mt={1} mx={2}>Category: {currentlyLearningCard.category}</Typography>    
                    </Box>
            </Card>
        </Box>
        :
        <>
            <Skeleton variant="rectangular" height={'100%'} />
            <Box>
                <Skeleton />
                <Skeleton width="60%" />
            </Box>
        </>    
        }
        </>
    );
}

function ViewPrompts({ studentInfo, studentCards }: { studentInfo: StudentInfo, studentCards: Map<string, StudentCard> }) {
    const [promptFilter, setPromptFilter] = useState<{ cardID: string | undefined, startDate: Date | undefined, endDate: Date | undefined }>({
        cardID: "",
        startDate: undefined,
        endDate: undefined,
    });
    const [startDatecleared, setStartDateCleared] = useState<boolean>(false);
    const [endDatecleared, setEndDateCleared] = useState<boolean>(false);
    const [studentPromptsData, setStudentPromptsData] = useState<SessionPromptMap | null>(null)
    const [studentPromptsCard, setStudentPromptsCard] = useState<string[]>([]);


    const handlePromptFilterChange = ({ cardID, startDate, endDate }: { cardID: string, startDate: Date | undefined, endDate: Date | undefined }) => {
        setPromptFilter({ cardID, startDate, endDate });
    };

    const handleStartDateChange = (value: dayjs.Dayjs | null) => {
        if (value) {
            // Convert dayjs object to JavaScript Date
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


    useEffect(() => {
        const fetchStudentPromptData = async () => {
            try {
                const newStudentPrompts = await getStudentPromptData(studentInfo.userID as string, String(studentInfo.phase));
                setStudentPromptsData(newStudentPrompts);
                setStudentPromptsCard(getCardIdsFromStudentPromptData(newStudentPrompts));
            } catch (error) {
                console.error("Error fetching student prompts:", error);
            }
        };
        fetchStudentPromptData();
    }, [studentInfo.userID, studentInfo.phase]);

    const studentPromptsChart = useMemo(() => filterStudentChartData(studentPromptsData, promptFilter.cardID as string, promptFilter.startDate, promptFilter.endDate), [studentPromptsData, promptFilter.cardID, promptFilter.startDate, promptFilter.endDate]);

    const inputArrays =
    {
        Independent: studentPromptsChart?.independentArray || [],
        Verbal: studentPromptsChart?.verbalArray || [],
        Gestural: studentPromptsChart?.gesturalArray || [],
        Modeling: studentPromptsChart?.modelingArray || [],
        Physical: studentPromptsChart?.physicalArray || [],
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
                            <InputLabel id="demo-simple-select-label">Card</InputLabel>
                            <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={promptFilter.cardID as string}
                                label="Prompt Filter"
                                onChange={(event: SelectChangeEvent) => handlePromptFilterChange({ ...promptFilter, cardID: event.target.value as string })}
                            >
                                <MenuItem value={""}>All</MenuItem>
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
                        { data: studentPromptsChart?.independentArray || [], label: 'Independent', },
                        { data: studentPromptsChart?.verbalArray || [], label: 'Verbal', },
                        { data: studentPromptsChart?.gesturalArray || [], label: 'Gestural', },
                        { data: studentPromptsChart?.modelingArray || [], label: 'Modeling', },
                        { data: studentPromptsChart?.physicalArray || [], label: 'Physical', },
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
                    }}}
                    sx={{
                        mr: -10,
                    }}
                    height={200} width={270}
                />
            </Card>
        </Box>
    );
}