import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { useEffect, useState } from 'react';
import { getStudentInfo, getStudentPromptData } from '../functions/query';
import { useParams } from 'react-router-dom';
import { LineChart, PieChart } from '@mui/x-charts';
import { Box } from '@mui/material';
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

export default function StudentAnalytics() {
    const { studentId } = useParams();
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
    const [studentPromptsData, setStudentPromptsData] = useState<ChartData | null>(null)

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

        fetchStudentName();
        fetchStudentPromptData();
    }, [studentId, studentInfo?.phase]);


    function generateDateArray(startDate: string, endDate: string) {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Loop through each date from start to end
        for (let current = start; current <= end; current.setDate(current.getDate() + 1)) {
            dates.push(current.toISOString().split('T')[0]); // Format to YYYY-MM-DD
        }

        return dates;
    }
    const dateArray = generateDateArray('2024-10-01', '2024-10-30');

    function generateRandomNumbers(low: number, high: number, subtractValue: number = 0): number[] {
        const randomNumbers: number[] = [];

        for (let i = 0; i < 30; i++) {
            // Generate a random number in the specified range
            const randomNumber = Math.floor(Math.random() * (high - low + 1)) + low;

            // Subtract the specified value, ensuring it does not go below zero
            const adjustedNumber = Math.max(0, randomNumber - subtractValue);

            randomNumbers.push(adjustedNumber);
        }

        return randomNumbers;
    }


    const physicalArray = generateRandomNumbers(0, 5, 4);
    const modellingArray = generateRandomNumbers(0, 5, 2);
    const gesturalArray = generateRandomNumbers(0, 5, 2);
    const verbalArray = generateRandomNumbers(0, 5,);
    const independentArray = generateRandomNumbers(0, 5);

    const inputArrays = {
        Physical: physicalArray,
        Modelling: modellingArray,
        Gestural: gesturalArray,
        Verbal: verbalArray,
        Independent: independentArray,
    };

    function calculatePercentages(arrays: { [key: string]: number[] }): { label: string; value: number }[] {
        const totalSum = Object.values(arrays).reduce((sum, arr) => sum + arr.reduce((a, b) => a + b, 0), 0);

        return Object.entries(arrays).map(([label, values]) => {
            const sum = values.reduce((a, b) => a + b, 0);
            const percentage = totalSum > 0 ? (sum / totalSum) * 100 : 0; // Calculate percentage
            return { label, value: Number(percentage.toFixed(2)) }; // Format to two decimal places
        });
    }

    const percentagesData = calculatePercentages(inputArrays);
    const valueFormatter = (item: { value: number }) => `${item.value}%`;

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

    function changeLink() {
        // Select the anchor element by its ID
        const linkElement = document.getElementById('navbar-analytics-button');

        // Change the href dynamically
        if (linkElement) {
            linkElement.href = `/Home/Analytics/${studentId}`;
            linkElement.style.visibility = 'visible';
        }

    }

    changeLink();

    return (
        <Box sx={{
        }}>
            <Typography variant='h5' component='h5'>{`${studentInfo?.name}'s Analytics`}</Typography>
            {/* <BarChart
                xAxis={[{ scaleType: 'band', data: dateArray }]}
                series={[
                    { data: physicalArray, label: 'Physical', stack: 'all' },
                    { data: modellingArray, label: 'Modelling', stack: 'all' },
                    { data: gesturalArray, label: 'Gestural', stack: 'all' },
                    { data: verbalArray, label: 'Verbal', stack: 'all' },
                    { data: independentArray, label: 'Independent', stack: 'all' },
                ]}
                height={500}
                barLabel="value"
            /> */}

            {/* <LineChart
                xAxis={[{ scaleType: 'band', data: dateArray }]}
                series={[
                    { data: physicalArray, label: 'Physical', area: true, stack: 'all' },
                    { data: modellingArray, label: 'Modelling', area: true, stack: 'all' },
                    { data: gesturalArray, label: 'Gestural', area: true, stack: 'all' },
                    { data: verbalArray, label: 'Verbal', area: true, stack: 'all' },
                    { data: independentArray, label: 'Independent', area: true, stack: 'all' },
                ]}
                height={500}

            /> */}

            {studentPromptsData ?
                <LineChart
                    xAxis={[{ scaleType: 'band', data: studentPromptsData?.dateArray }]}
                    series={[
                        { data: studentPromptsData?.physicalArray, label: 'Physical', },
                        { data: studentPromptsData?.modelingArray, label: 'Modeling', },
                        { data: studentPromptsData?.gesturalArray, label: 'Gestural', },
                        { data: studentPromptsData?.verbalArray, label: 'Verbal', },
                        { data: studentPromptsData?.independentArray, label: 'Independent', },
                    ]}
                    height={500}
                    grid={{ vertical: true, horizontal: true }}
                /> :
                <Typography>{"Loading..."}</Typography>
            }

            <LineChart
                xAxis={[{ scaleType: 'band', data: dateArray }]}
                series={[
                    { data: physicalArray, label: 'Physical', },
                    { data: modellingArray, label: 'Modeling', },
                    { data: gesturalArray, label: 'Gestural', },
                    { data: verbalArray, label: 'Verbal', },
                    { data: independentArray, label: 'Independent', },
                ]}
                height={500}
            />

            <PieChart
                series={[
                    {
                        data: percentagesData,
                        highlightScope: { fade: 'global', highlight: 'item' },
                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                        valueFormatter,
                    },
                ]}
                height={300}
            />
            <Typography variant='h6' component='h6'>{`Phase x `}</Typography>


            <Gauge width={100} height={100} value={calculateWeightedSum(inputArrays) / 6} />
        </Box>

    );
}