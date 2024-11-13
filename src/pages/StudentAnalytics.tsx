import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { useEffect, useState, useMemo, useRef } from 'react';
import { fetchRecentSessionWithTappedCards, filterStudentChartData, getCardIdsFromStudentPromptData, getIndependentCardIds, getStudentCards, getStudentInfo, getStudentPromptData, SessionPromptMap } from '../functions/query';
import { useParams } from 'react-router-dom';
import { LineChart, PieChart } from '@mui/x-charts';
import { Box, Card, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import IndependentCards from '../components/IndependentCards';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

interface StudentInfo {
    birthday: Timestamp;
    email: string;
    name: string;
    phase?: number;
    userID: string;
    userType: string;
}

interface ChartData {
    dateArray: string[];
    gesturalArray: number[];
    independentArray: number[];
    modelingArray: number[];
    physicalArray: number[];
    verbalArray: number[];
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

type StudentCard = {
    category: string;
    imageUrl: string;
    isFavorite?: boolean;
    phase1_independence?: boolean;
    phase2_independence?: boolean;
    phase3_independence?: boolean;
    tapCount: number;
    title: string;
    userId: string;
}

const promptPalette = ["#ff6260", "#fcc260", "#aae173", "#6c8dff", "#9e7cff"];

export default function StudentAnalytics() {
    const { studentId } = useParams();
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
    const [studentPromptsData, setStudentPromptsData] = useState<SessionPromptMap | null>(null)
    const [recentSessionData, setRecentSessionData] = useState<{ session: SessionInfo, tappedCards: TappedCard[] } | null>(null);
    const [promptFilter, setPromptFilter] = useState<{ cardID: string | undefined, startDate: Date | undefined, endDate: Date | undefined }>({
        cardID: "",
        startDate: undefined,
        endDate: undefined,
    });
    const [independentCardIds, setIndependentCardIds] = useState<string[]>([]);
    const [studentCards, setStudentCards] = useState<Map<string, StudentCard>>(new Map<string, StudentCard>());
    const studentPromptsCard = useRef<string[]>([]);
    const [startDatecleared, setStartDateCleared] = useState<boolean>(false);
    const [endDatecleared, setEndDateCleared] = useState<boolean>(false);

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
                // console.log("testNewStudent")
                // console.log(newStudentPrompts)
                studentPromptsCard.current = getCardIdsFromStudentPromptData(newStudentPrompts);
            } catch (error) {
                console.error("Error fetching student prompts:", error);
            }
        };

        const fetchRecentSessionData = async () => {
            const recentSessionData = await fetchRecentSessionWithTappedCards(studentId as string);
            setRecentSessionData({ session: recentSessionData.session as SessionInfo, tappedCards: recentSessionData.tappedCards });
        };

        const fetchIndependentCardIds = async () => {
            const fetchedIndependentCardIds = await getIndependentCardIds(studentId as string, String(studentInfo?.phase));
            setIndependentCardIds(fetchedIndependentCardIds);
            // console.log('independent')
            // console.log(independentCardIds)
        };

        const fetchStudentCards = async () => {
            const fetchedStudentCards = await getStudentCards(studentId as string,);
            setStudentCards(fetchedStudentCards);
        };

        fetchStudentName();
        fetchStudentPromptData();
        fetchRecentSessionData();
        fetchIndependentCardIds();
        fetchStudentCards();
    }, [studentId, studentInfo?.phase, promptFilter]);

    // useEffect(() => {
    //     studentPromptsCard.current = getCardIdsFromStudentPromptData(studentPromptsData);
    // }, [studentPromptsData]);

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
    const valueFormatter = (item: { value: number }) => { return item.value === 0 ? `` : `${item.value}%` };

    const prepareBarGraphData = (tappedCards: TappedCard[]) => {
        const titleCounts: { [key: string]: number } = {};

        tappedCards.forEach(card => {
            // Increment the count for the card title
            titleCounts[card.cardTitle] = (titleCounts[card.cardTitle] || 0) + 1;
        });

        // Convert titleCounts to arrays for xAxis and series
        const titles = Object.keys(titleCounts);
        const dataValues = titles.map(title => titleCounts[title]);

        return { titles, dataValues };
    };
    const barGraphData = recentSessionData ? prepareBarGraphData(recentSessionData.tappedCards) : { titles: [], dataValues: [] };

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
        <Box sx={{
            m: 6,
        }}>

            <Typography variant='h3' component='h3'>{`${studentInfo?.name}'s Analytics Overview`}</Typography>
            <Typography variant='h4' component='h4' mt={2}>{`Phase: ${studentInfo?.phase}`}</Typography>

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

                        {/* <Card
                            elevation={4}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                p: 2,
                                flex: '1 1',
                            }}
                        >
                        </Card> */}

                        <Card elevation={4}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                p: 2,
                                overflowX: 'auto'
                            }}
                        >
                            <Typography variant='h6' component='h6'>{`Most Recent Session`}</Typography>
                            <Typography variant='subtitle1' mt={1}>{`Time: ${recentSessionData?.session?.sessionTime.toDate()}`}</Typography>
                            <Typography variant='subtitle1'>{`Total cards tapped: ${recentSessionData?.tappedCards.length}`}</Typography>
                            <BarChart
                                xAxis={[{ scaleType: 'band', data: barGraphData.titles }]}
                                series={[{ data: barGraphData.dataValues }]}
                                height={160}
                            />
                        </Card>

                    </Box>

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
                                            {/* {Array.from(studentCards.entries()).map(([cardId, card]) => (
                                                <MenuItem key={cardId} value={cardId}>
                                                    {card.title}
                                                </MenuItem>
                                            ))} */}
                                        </Select>
                                    </FormControl>
                                    {/* <DatePicker label="Start Date" format="LL" sx={{ width: '150%' }} onChange={handleStartDateChange} */}
                                    <DatePicker label="Start Date" format="LL" sx={{ width: '150%' }} value={promptFilter.startDate ? dayjs(promptFilter.startDate) : null} onChange={handleStartDateChange}
                                        slotProps={{
                                            field: { clearable: true, onClear: () => setStartDateCleared(true) },
                                        }} />
                                    {/* <DatePicker label="End Date" format="LL" sx={{ width: '150%' }} onChange={handleEndDateChange} */}
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
                                        arcLabel: valueFormatter,
                                    },
                                ]}
                                height={160} width={400}
                            />
                        </Card>
                    </Box>


                    <Box gap={3}
                        sx={{
                            mt: 3,
                            display: 'flex',
                            flexWrap: 'wrap',
                        }}>

                        <Card
                            elevation={4}
                            sx={{
                                my: 3,
                                p: 1,
                                minHeight: '400px',
                                flex: '3 3',
                            }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }} mt={2} mx={2}>
                                <Typography variant='h4' component='h4'>Independent Cards</Typography>
                                <IndependentCards studentId={studentId as string} cardIds={independentCardIds} />
                            </Box>
                        </Card>
                    </Box>
                </>
                :
                <Typography>{"Loading..."}</Typography>
            }
        </Box >

    );
}