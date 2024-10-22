import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { useEffect, useState } from 'react';
import { fetchRecentSessionWithTappedCards, getStudentInfo, getStudentPromptData } from '../functions/query';
import { useParams } from 'react-router-dom';
import { LineChart, PieChart } from '@mui/x-charts';
import { Box, Card } from '@mui/material';
import { Gauge } from '@mui/x-charts/Gauge';
import { Timestamp } from 'firebase/firestore';

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

export default function StudentAnalytics() {
    const { studentId } = useParams();
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
    const [studentPromptsData, setStudentPromptsData] = useState<ChartData | null>(null)
    const [recentSessionData, setRecentSessionData] = useState<{ session: SessionInfo, tappedCards: TappedCard[] } | null>(null);

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
                console.log("testNewStudent")
                console.log(newStudentPrompts)
            } catch (error) {
                console.error("Error fetching student prompts:", error);
            }
        };

        const fetchRecentSessionData = async () => {
            const recentSessionData = await fetchRecentSessionWithTappedCards(studentId as string);
            setRecentSessionData({ session: recentSessionData.session as SessionInfo, tappedCards: recentSessionData.tappedCards });
        };

        fetchStudentName();
        fetchStudentPromptData();
        fetchRecentSessionData();
    }, [studentId, studentInfo?.phase]);


    // function generateDateArray(startDate: string, endDate: string) {
    //     const dates = [];
    //     const start = new Date(startDate);
    //     const end = new Date(endDate);

    //     // Loop through each date from start to end
    //     for (let current = start; current <= end; current.setDate(current.getDate() + 1)) {
    //         dates.push(current.toISOString().split('T')[0]); // Format to YYYY-MM-DD
    //     }

    //     return dates;
    // }
    // const dateArray = generateDateArray('2024-10-01', '2024-10-30');

    // function generateRandomNumbers(low: number, high: number, subtractValue: number = 0): number[] {
    //     const randomNumbers: number[] = [];

    //     for (let i = 0; i < 30; i++) {
    //         // Generate a random number in the specified range
    //         const randomNumber = Math.floor(Math.random() * (high - low + 1)) + low;

    //         // Subtract the specified value, ensuring it does not go below zero
    //         const adjustedNumber = Math.max(0, randomNumber - subtractValue);

    //         randomNumbers.push(adjustedNumber);
    //     }

    //     return randomNumbers;
    // }


    // const physicalArray = generateRandomNumbers(0, 5, 4);
    // const modellingArray = generateRandomNumbers(0, 5, 2);
    // const gesturalArray = generateRandomNumbers(0, 5, 2);
    // const verbalArray = generateRandomNumbers(0, 5,);
    // const independentArray = generateRandomNumbers(0, 5);

    // const inputArrays = {
    //     Physical: physicalArray,
    //     Modelling: modellingArray,
    //     Gestural: gesturalArray,
    //     Verbal: verbalArray,
    //     Independent: independentArray,
    // };

    const inputArrays =
    {
        Independent: studentPromptsData?.independentArray || [],
        Verbal: studentPromptsData?.verbalArray || [],
        Gestural: studentPromptsData?.gesturalArray || [],
        Modelling: studentPromptsData?.modelingArray || [],
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

    function calculateWeightedSum(inputArrays: { [key: string]: number[] }): number {
        // Define the weights for each category
        const weights: { [key: string]: number } = {
            Independent: 1.00,
            Verbal: 0.75,
            Gestural: 0.50,
            Modelling: 0.25,
            Physical: 0.05,
        };

        // Calculate the weighted sum
        const totalSum = Object.entries(inputArrays).reduce((total, [label, values]) => {
            const weight = weights[label] || 0; // Get the weight or default to 0
            const weightedSum = values.reduce((sum, value) => sum + (value * weight), 0); // Multiply each value by the weight and sum
            return total + weightedSum; // Add the weighted sum to the total
        }, 0);

        return totalSum; // Return the total weighted sum
    }

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
            m: 5,
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
                        }}>

                        <Card
                            elevation={4}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                p: 2,
                                flex: '1 1',
                            }}
                        >
                            <Typography variant='h6' component='h6'>{`Phase Progression Points`}</Typography>
                            <Gauge
                                height={160}
                                width={160}
                                value={calculateWeightedSum(inputArrays) / 600}
                                text={`${calculateWeightedSum(inputArrays)}/600`}
                                sx={{
                                    '& .MuiGauge-valueText': {
                                        fontFamily: 'Arial',  // Change to your desired font family
                                        fontSize: '24px',     // Change the font size as needed
                                        fontWeight: 'bold',
                                    },
                                    flex: '1 1',
                                }}
                            />
                            <Typography variant='subtitle1' >{`${studentInfo?.name} is ${calculateWeightedSum(inputArrays) / 600}% ready for the next phase`}</Typography>
                        </Card>

                        <Card
                            elevation={4}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                p: 2,
                            }}
                        >
                            <Typography variant='h6' component='h6'>{`Prompts Distribution`}</Typography>
                            <PieChart
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
                                flex: '2 1',
                            }}
                        >
                            <Typography variant='h6' component='h6'>{`Most Recent Session`}</Typography>
                            <Typography variant='subtitle1' mt={1}>{`Time: ${recentSessionData?.session.sessionTime.toDate()}`}</Typography>
                            <Typography variant='subtitle1'>{`Total cards tapped: ${recentSessionData?.tappedCards.length}`}</Typography>
                            <BarChart
                                xAxis={[{ scaleType: 'band', data: barGraphData.titles }]}
                                series={[{ data: barGraphData.dataValues }]}
                                sx={{ width: '100%' }}
                                height={200}
                            />
                        </Card>
                    </Box>

                    <Card
                        elevation={4}
                        sx={{
                            mt: 3,
                            p: 1,
                        }}>

                        <Typography variant='h4' component='h4' mt={2} ml={2}>{`Prompts per day`}</Typography>

                        <LineChart
                            xAxis={[{ scaleType: 'band', data: studentPromptsData?.dateArray }]}
                            series={[
                                { data: studentPromptsData?.physicalArray, label: 'Physical', },
                                { data: studentPromptsData?.modelingArray, label: 'Modeling', },
                                { data: studentPromptsData?.gesturalArray, label: 'Gestural', },
                                { data: studentPromptsData?.verbalArray, label: 'Verbal', },
                                { data: studentPromptsData?.independentArray, label: 'Independent', },
                            ]}
                            height={400}
                            grid={{ vertical: true, horizontal: true }}
                        />

                    </Card>

                </>
                :
                <Typography>{"Loading..."}</Typography>
            }


            {/* <LineChart
                xAxis={[{ scaleType: 'band', data: dateArray }]}
                series={[
                    { data: physicalArray, label: 'Physical', },
                    { data: modellingArray, label: 'Modeling', },
                    { data: gesturalArray, label: 'Gestural', },
                    { data: verbalArray, label: 'Verbal', },
                    { data: independentArray, label: 'Independent', },
                ]}
                height={500}
            /> */}

            {/* <PieChart
                series={[
                    {
                        data: percentagesData,
                        highlightScope: { fade: 'global', highlight: 'item' },
                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                        valueFormatter,
                    },
                ]}
                height={300}
            /> */}
        </Box >

    );
}