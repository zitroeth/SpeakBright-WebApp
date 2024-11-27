import Typography from '@mui/material/Typography';
import mainTheme from '../themes/Theme';
import speakBrightLogo from '../assets/SpeakBright_PL 3 CROP.png';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { getStudents } from '../functions/query';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import useAuth from '../hooks/useAuth';

export default function GuardianHome() {
    const [papers, setPapers] = useState<React.ReactNode[]>([]);

    const { currentUser } = useAuth();

    const handlePaperClick = async (index: string) => {
        window.location.href = `/Home/${index}`;
    };

    useEffect(() => {
        const fetchPapers = async () => {
            const papersArray = [];
            let studentList = null;

            if (currentUser?.uid) {
                studentList = await getStudents(currentUser.uid);
            }

            if (studentList) {
                papersArray.push(
                    <Paper
                        key={`add-student`}
                        elevation={0}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '20vh',
                            height: '20vh',
                            borderRadius: '8px',
                            margin: '2%',
                            border: `4px dashed ${mainTheme.palette.secondary.main}`,
                            padding: '.5rem',
                            backgroundColor: '#f0e3f0',
                            flexShrink: 0,
                            cursor: 'pointer',
                        }}
                        onClick={() => window.location.href = '/Register'}
                    >
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                color: mainTheme.palette.secondary.main,
                                textTransform: "capitalize",
                                whiteSpace: 'normal',
                                overflow: 'visible',
                            }}
                        >
                            {`Add student`}
                        </Typography>
                        <AddIcon
                            sx={{
                                color: mainTheme.palette.secondary.main,
                                fontSize: '3em',
                            }} />
                    </Paper>);
                for (const [key, value] of studentList) {
                    papersArray.push(
                        <Paper
                            key={key}
                            elevation={0}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '20vh',
                                height: '20vh',
                                borderRadius: '8px',
                                margin: '2%',
                                padding: '.5rem',
                                backgroundColor: '#ffffff',
                                flexShrink: 0,
                                cursor: 'pointer',
                                ':hover': {
                                    boxShadow: 5,
                                },
                            }}
                            onClick={() => handlePaperClick(key)}
                        >
                            <Typography
                                variant="h6"
                                component="div"
                                sx={{
                                    textTransform: "capitalize",
                                    textAlign: 'center',
                                }}
                            >
                                {value['name']}
                            </Typography>
                        </Paper>
                    );
                }
            }
            setPapers(papersArray);
        };

        fetchPapers();
    }, [currentUser?.uid]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                height: '100%',
            }}

        >
            <Typography
                variant="h6"
                component="div"
                sx={{
                    textTransform: "uppercase",
                    letterSpacing: '.3rem',
                    fontSize: '1.5rem',
                    color: mainTheme.palette.primary.main,
                    mt: '1em'
                }}
            >
                Welcome to
            </Typography>
            <img src={speakBrightLogo} alt="SpeakBright Logo" id='paper-logo'
                style={{
                    height: '5rem'
                }}
            ></img>
            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                    width: '65%',
                    height: '65%',
                    borderRadius: '8px',
                    margin: '2% 5%',
                    padding: '2rem',
                    backgroundColor: '#f0e3f0',
                    overflowX: 'hidden',
                    overflowY: 'auto'
                }}
                className='home-paper'>

                {papers}
            </Paper>
        </Box>
    );
}