import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { useEffect, useState } from 'react';
import { fetchRecentSessionWithTappedCards, getIndependentCardIds, getStudentInfo, getStudentPromptData } from '../functions/query';
import { useParams } from 'react-router-dom';
import { LineChart, PieChart } from '@mui/x-charts';
import { Box, Card, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import IndependentCards from '../components/IndependentCards';

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

const promptPalette = ["#ff6260", "#fcc260", "#aae173", "#6c8dff", "#9e7cff"];

export default function StudentAnalytics() {
    const { studentId } = useParams();
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
    const [studentPromptsData, setStudentPromptsData] = useState<ChartData | null>(null)
    const [recentSessionData, setRecentSessionData] = useState<{ session: SessionInfo, tappedCards: TappedCard[] } | null>(null);
    const [promptFilter, setPromptFilter] = useState("Daily");
    const [independentCardIds, setIndependentCardIds] = useState<string[]>([]);

    const handlePromptFilterChange = (event: SelectChangeEvent) => {
        setPromptFilter(event.target.value as string);
    };

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
                const newStudentPrompts = await getStudentPromptData(studentId as string, String(studentInfo?.phase), promptFilter);
                setStudentPromptsData(newStudentPrompts);
                // console.log("testNewStudent")
                // console.log(newStudentPrompts)
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

        fetchStudentName();
        fetchStudentPromptData();
        fetchRecentSessionData();
        fetchIndependentCardIds();
    }, [studentId, studentInfo?.phase, promptFilter]);

    const inputArrays =
    {
        Independent: studentPromptsData?.independentArray || [],
        Verbal: studentPromptsData?.verbalArray || [],
        Gestural: studentPromptsData?.gesturalArray || [],
        Modeling: studentPromptsData?.modelingArray || [],
        Physical: studentPromptsData?.physicalArray || [],
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

                    <Card
                        elevation={4}
                        sx={{
                            mt: 3,
                            p: 1,
                        }}>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }} mt={2} mx={2}>
                            <Typography variant='h4' component='h4' >{`Prompts by ${promptFilter === "Daily" ? "Day" : promptFilter.split("ly")[0]}`}</Typography>
                            <Box sx={{ minWidth: 120 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">Filter</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={promptFilter}
                                        label="Prompt Filter"
                                        onChange={handlePromptFilterChange}
                                    >
                                        <MenuItem value={"Daily"}>Daily</MenuItem>
                                        <MenuItem value={"Weekly"}>Weekly</MenuItem>
                                        <MenuItem value={"Monthly"}>Monthly</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <LineChart
                            colors={promptPalette}
                            xAxis={[{ scaleType: 'band', data: studentPromptsData?.dateArray }]}
                            series={[
                                { data: studentPromptsData?.independentArray, label: 'Independent', },
                                { data: studentPromptsData?.verbalArray, label: 'Verbal', },
                                { data: studentPromptsData?.gesturalArray, label: 'Gestural', },
                                { data: studentPromptsData?.modelingArray, label: 'Modeling', },
                                { data: studentPromptsData?.physicalArray, label: 'Physical', },
                            ]}
                            height={400}
                            grid={{ vertical: true, horizontal: true }}
                        />

                    </Card>

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

                        {/* <Card
                            elevation={4}
                            sx={{
                                my: 3,
                                p: 1,
                                minHeight: '400px',
                                flex: '2 2',
                            }}>
                        </Card> */}
                    </Box>

                </>
                :
                <Typography>{"Loading..."}</Typography>
            }
        </Box >

    );
}