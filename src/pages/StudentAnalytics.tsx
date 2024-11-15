import Typography from '@mui/material/Typography';
import { useEffect, useState, useMemo, useRef } from 'react';
import { StudentCard, convertMillisecondsToReadableString, filterStudentChartData, getCardIdsFromStudentPromptData, getFirstCardPromptInstance, getPhasesPromptData, getStudentInfo, getStudentPhaseDuration, getStudentProgressScore, getStudentPromptData, PhasePromptMap, SessionPromptMap, getStudentCards } from '../functions/query';
import { useParams } from 'react-router-dom';
import { BarChart, Gauge, LineChart, } from '@mui/x-charts';
import { Box, Card, Chip, Stack } from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import MuiGauge from '../components/MuiGauge';

interface StudentInfo {
    birthday: Timestamp;
    email: string;
    name: string;
    phase?: number;
    userID: string;
    userType: string;
}

// interface ChartData {
//     dateArray: string[];
//     gesturalArray: number[];
//     independentArray: number[];
//     modelingArray: number[];
//     physicalArray: number[];
//     verbalArray: number[];
// }

// interface SessionInfo {
//     sessionID: string;
//     sessionTime: Timestamp;
// }

// interface TappedCard {
//     id: string;
//     cardTitle: string;
//     category: string;
//     timeTapped: Timestamp;
// }

// type StudentCard = {
//     category: string;
//     imageUrl: string;
//     isFavorite?: boolean;
//     phase1_independence?: boolean;
//     phase2_independence?: boolean;
//     phase3_independence?: boolean;
//     tapCount: number;
//     title: string;
//     userId: string;
// }

// const promptPalette = ["#ff6260", "#fcc260", "#aae173", "#6c8dff", "#9e7cff"];
// const phaseColors = ["#7bb242", "#df40fa", "#05a8f3", "#ea524f"];
const phaseNewColors = [{ bg: '#b6dd8d', text: '#2a3716' }, { bg: '#f4b3ff', text: '#4f0341' }, { bg: '#94ddff', text: '#0e3677' }, { bg: '#fdacaa', text: '#4b0606' }];

export default function StudentAnalytics() {
    const { studentId } = useParams();
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
    const [studentPromptsData, setStudentPromptsData] = useState<SessionPromptMap | null>(null)
    // const [promptFilter, setPromptFilter] = useState<{ cardID: string | undefined, startDate: Date | undefined, endDate: Date | undefined }>({
    //     cardID: "",
    //     startDate: undefined,
    //     endDate: undefined,
    // });
    // const [independentCardIds, setIndependentCardIds] = useState<string[]>([]);
    // const [studentCards, setStudentCards] = useState<Map<string, StudentCard>>(new Map<string, StudentCard>());
    const studentPromptsCard = useRef<string[]>([]);
    // const [startDatecleared, setStartDateCleared] = useState<boolean>(false);
    // const [endDatecleared, setEndDateCleared] = useState<boolean>(false);
    const [phasesDuration, setPhasesDuration] = useState<Array<{ label: string, value: number }>>([]);
    const [firstPromptInstances, setFirstCardPromptInstance] = useState<Map<string, Date>>(new Map<string, Date>());
    const [phasesPromptData, setPhasesPromptData] = useState<PhasePromptMap | null>(null);
    const [studentCards, setStudentCards] = useState<Map<string, StudentCard>>();

    // const handlePromptFilterChange = ({ cardID, startDate, endDate }: { cardID: string, startDate: Date | undefined, endDate: Date | undefined }) => {
    //     setPromptFilter({ cardID, startDate, endDate });
    // };

    // const handleStartDateChange = (value: dayjs.Dayjs | null) => {
    //     if (value) {
    //         // Convert dayjs object to JavaScript Date
    //         const jsDate = value.toDate();
    //         // setPromptFilter({ ...promptFilter, startDate: jsDate });
    //         setPromptFilter(prevFilter => {
    //             const updatedFilter = { ...prevFilter, startDate: jsDate };

    //             if (prevFilter.endDate === undefined) {
    //                 updatedFilter.endDate = jsDate;
    //             }
    //             return updatedFilter;
    //         });
    //     } else {
    //         setPromptFilter({ ...promptFilter, startDate: undefined });
    //     }
    // };

    // const handleEndDateChange = (value: dayjs.Dayjs | null) => {
    //     if (value) {
    //         // Convert dayjs object to JavaScript Date
    //         const jsDate = value.toDate();
    //         setPromptFilter({ ...promptFilter, endDate: jsDate });
    //     } else {
    //         setPromptFilter({ ...promptFilter, endDate: undefined });
    //     }
    // };

    // useEffect(() => {
    //     if (startDatecleared) {
    //         const timeout = setTimeout(() => {
    //             setStartDateCleared(false);
    //         }, 1500);

    //         return () => clearTimeout(timeout);
    //     }
    //     return () => { };
    // }, [startDatecleared]);

    // useEffect(() => {
    //     if (endDatecleared) {
    //         const timeout = setTimeout(() => {
    //             setEndDateCleared(false);
    //         }, 1500);

    //         return () => clearTimeout(timeout);
    //     }
    //     return () => { };
    // }, [endDatecleared]);

    useEffect(() => {
        const fetchStudentName = async () => {
            try {
                const newStudentInfo = await getStudentInfo(studentId as string);
                setStudentInfo(newStudentInfo);
            } catch (error) {
                console.error("Error fetching student info:", error);
            }
        };

        const fetchStudentPromptData = async () => {
            try {
                const newStudentPrompts = await getStudentPromptData(studentId as string, String(studentInfo?.phase));
                setStudentPromptsData(newStudentPrompts);
                studentPromptsCard.current = getCardIdsFromStudentPromptData(newStudentPrompts);
            } catch (error) {
                console.error("Error fetching student prompts:", error);
            }
        };

        const fetchPhasePromptData = async () => {
            try {
                const newPhasePromptData = await getPhasesPromptData(studentId as string);
                setPhasesPromptData(newPhasePromptData);
            } catch (error) {
                console.error("Error fetching student prompts:", error);
            }
        };

        // const fetchIndependentCardIds = async () => {
        //     const fetchedIndependentCardIds = await getIndependentCardIds(studentId as string, String(studentInfo?.phase));
        //     setIndependentCardIds(fetchedIndependentCardIds);
        // };

        // const fetchStudentCards = async () => {
        //     const fetchedStudentCards = await getStudentCards(studentId as string,);
        //     setStudentCards(fetchedStudentCards);
        // };

        const fetchPhasesDuration = async () => {
            const fetchedPhasesDuration = await getStudentPhaseDuration(studentId as string);
            setPhasesDuration(fetchedPhasesDuration);
        };

        const fetchStudentCards = async () => {
            const fetchedStudentCards = await getStudentCards(studentId as string);
            setStudentCards(fetchedStudentCards);
        };

        fetchStudentName();
        fetchStudentPromptData();
        // fetchRecentSessionData();
        // fetchIndependentCardIds();
        // fetchStudentCards();
        fetchPhasesDuration();
        fetchPhasePromptData();
        fetchStudentCards();

    }, [studentId, studentInfo?.phase]);

    useEffect(() => {
        const fetchFirstCardPromptInstance = async () => {
            const fetchedFirstCardPromptInstance = await getFirstCardPromptInstance(studentPromptsData);
            setFirstCardPromptInstance(fetchedFirstCardPromptInstance);
        };

        fetchFirstCardPromptInstance();
    }, [studentPromptsData]);

    // useEffect(() => {
    //     studentPromptsCard.current = getCardIdsFromStudentPromptData(studentPromptsData);
    // }, [studentPromptsData]);

    // const studentPromptsChart = useMemo(() => filterStudentChartData(studentPromptsData, promptFilter.cardID as string, promptFilter.startDate, promptFilter.endDate), [studentPromptsData, promptFilter.cardID, promptFilter.startDate, promptFilter.endDate]);
    const studentProgressScores = useMemo(() => getStudentProgressScore(studentPromptsData), [studentPromptsData]);

    // const inputArrays =
    // {
    //     Independent: studentPromptsChart?.independentArray || [],
    //     Verbal: studentPromptsChart?.verbalArray || [],
    //     Gestural: studentPromptsChart?.gesturalArray || [],
    //     Modeling: studentPromptsChart?.modelingArray || [],
    //     Physical: studentPromptsChart?.physicalArray || [],
    // }


    // function calculatePercentages(arrays: { [key: string]: number[] }): { label: string; value: number }[] {
    //     const totalSum = Object.values(arrays).reduce((sum, arr) => sum + arr.reduce((a, b) => a + b, 0), 0);

    //     return Object.entries(arrays).map(([label, values]) => {
    //         const sum = values.reduce((a, b) => a + b, 0);
    //         const percentage = totalSum > 0 ? (sum / totalSum) * 100 : 0; // Calculate percentage
    //         return { label, value: Number(percentage.toFixed(2)) }; // Format to two decimal places
    //     });
    // }

    // const percentagesData = calculatePercentages(inputArrays);

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
        console.log(firstPromptInstances)
    }, [firstPromptInstances])

    useEffect(() => {
        console.log(phasesPromptData)
    }, [phasesPromptData]);

    return (
        <Box sx={{
            m: 6,
        }}>

            <Typography variant='h4' component='h4'>{`${studentInfo?.name}'s Analytics Overview`}</Typography>
            <Typography variant='h5' component='h5' mt={2}>{`Phase: ${studentInfo?.phase}`}</Typography>

            {studentPromptsData ?
                <>
                    <Box gap={3}
                        sx={{
                            mt: 3,
                            display: 'flex',
                            flexWrap: 'wrap',
                            minWidth: '100%',
                            maxWidth: '100%',
                        }}>

                        <Card
                            elevation={4}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                p: 2,
                            }}>
                            <Typography variant='h6' component='h6' >Time Spent Per Phase</Typography>
                            {/* <PieChart
                                colors={['#7bb242', '#df40fa', '#05a8f3', '#ea524f']}
                                series={[
                                    {
                                        data: phasesDuration,
                                        highlightScope: { fade: 'global', highlight: 'item' },
                                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                        valueFormatter: (item: { value: number }) => convertMillisecondsToReadableString(item.value),
                                    },
                                ]}
                                margin={{ top: -110, bottom: 0, left: 50, right: 50 }}
                                slotProps={{
                                    legend: {
                                        direction: 'row',
                                        position: { vertical: 'bottom', horizontal: 'left' },
                                        padding: { bottom: 50 / phasesDuration.length - 10 },
                                        itemGap: 10,
                                    }
                                }}
                                height={300}
                                width={250}
                            /> */}
                            <Box alignItems={'center'}>
                                <Stack spacing={2} py={2}>
                                    {phasesDuration.map((phase, index) => (
                                        <Chip
                                            key={index}
                                            label={
                                                <span>
                                                    Phase {phase.label}: &nbsp;&nbsp;<strong>{convertMillisecondsToReadableString(phase.value)}</strong>
                                                </span>
                                            }
                                            color='primary'
                                            style={{
                                                backgroundColor: phaseNewColors[index].bg,
                                                color: phaseNewColors[index].text,
                                                fontSize: '1em',
                                            }}
                                            sx={{ p: 3 }}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            <Typography variant='subtitle1'>Average time spent per phase: <strong>{convertMillisecondsToReadableString(phasesDuration.reduce((sum, phase) => sum + phase.value, 0) / phasesDuration.length)}</strong></Typography>
                        </Card>

                    </Box>

                    {/* <Box gap={2}
                        sx={{
                            mt: 4,
                            display: 'flex',
                            width: '100%',
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
                                            {studentPromptsCard.current.map((cardID) => (
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
                                overflowX: 'auto'
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
                                        valueFormatter,
                                    },
                                ]}
                                height={160} width={400}
                            />
                        </Card>
                    </Box> */}
                    {/* <Box gap={2}
                        sx={{
                            mt: 4,
                            display: 'flex',
                            width: '100%',
                        }}>
                        <Card
                            elevation={4}
                            sx={{
                                p: 1,
                                flex: 1,
                            }}>
                            <Typography variant='h4' component='h4' mt={2} mx={2}>Student Progress Score</Typography>
                            <BarChart
                                dataset={studentProgressScores}
                                colors={['#c5a4ed', '#790377']}
                                xAxis={[{ scaleType: 'band', dataKey: 'date' }]}
                                series={[{ dataKey: 'score', label: 'Score' },]}
                                resolveSizeBeforeRender
                                // width={500}
                                height={300}
                                sx={{
                                    width: '200px'
                                }}
                            />
                        </Card>
                    </Box> */}

                    <Box gap={2}
                        sx={{
                            mt: 4,
                            display: 'flex',
                            width: '100%',
                        }}>
                        <Card
                            elevation={4}
                            sx={{
                                p: 1,
                                flex: 1,
                            }}>
                            <Typography variant='h4' component='h4' mt={2} mx={2}>Student Progress Score</Typography>

                            <LineChart //relative change formula
                                dataset={studentProgressScores}
                                colors={['#c5a4ed', '#790377']}
                                xAxis={[{ dataKey: 'date', scaleType: 'band' }]}
                                yAxis={[{ valueFormatter: (value) => `${value}%` }]}
                                series={[{
                                    dataKey: 'variation',
                                    label: 'Variation',
                                    curve: 'linear',
                                    valueFormatter: (value) => {
                                        const formattedValue = `${value?.toFixed(2)}%`;
                                        return (
                                            <span style={{
                                                color: (value) && (value > 0) ? 'green' : (value as number < 0) ? 'red' : 'black'
                                            }}>
                                                {formattedValue}
                                            </span>
                                        );
                                    },
                                }]}
                                height={300}
                            />
                        </Card>
                    </Box>
                    <Box gap={2}
                        sx={{
                            mt: 4,
                            display: 'flex',
                            width: '100%',
                        }}>

                        {/* <Card
                            elevation={4}
                            sx={{
                                p: 1,
                                boxSizing: 'border-box',
                                flex: '1 1 25%',
                                minWidth: 'calc(90% / 4)',
                                maxWidth: 'calc(100% / 4)',
                            }}
                        >
                            <Typography variant='h4' component='h4' mt={2} mx={2}>Student Progress Score</Typography>
                        </Card> */}
                        {/* {phasesPromptData && Array.from(phasesPromptData.entries()).map(([key, data], index) => ( */}
                        <Card
                            elevation={4}
                            sx={{
                                p: 1,
                                boxSizing: 'border-box',
                                flex: '1 1 25%',
                                minWidth: 'calc(90% / 4)',
                                maxWidth: 'calc(100% / 4)',
                            }}
                        >
                            <Typography variant='h4' component='h4' mt={2} mx={2}>{`Phase ${1} Progress`}</Typography>
                            {/* <MuiGauge value={45} /> */}
                        </Card>
                        {/* ))} */}
                    </Box>
                </>
                :
                <Typography>{"Loading..."}</Typography>
            }
        </Box >

    );
}