import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { getCardCategories, getStudentCardsUsingIds } from '../functions/query';
import CardContent from '@mui/material/CardContent';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Tabs from '@mui/material/Tabs';
import { Tab, ThemeProvider } from '@mui/material';
import mainTheme from '../themes/Theme';

interface IndependentCardProps {
    studentId: string,
    cardIds: string[],
}


export default function IndependentCards({ studentId, cardIds }: IndependentCardProps) {
    const [categories, setCategories] = useState<Map<string, { category: string }> | null>(null);
    const [category, setCategory] = useState("All");
    const [independentCards, setIndependentCards] = useState<React.ReactNode[]>([]); // All Cards of current user
    const [cards, setCards] = useState<React.ReactNode[]>([]); // Filtered React Element Cards

    useEffect(() => {
        const fetchCategories = async () => {
            const categoryList = await getCardCategories();
            setCategories(categoryList);
        }

        const fetchCards = async () => {
            const cardsArray = [];
            let studentCards = null;
            studentCards = await getStudentCardsUsingIds(studentId, cardIds);

            if (studentCards) {
                for (const [key, value] of studentCards) {
                    cardsArray.push(
                        <Card key={key} data-category-type={value.category} sx={{ minHeight: '25vh', maxHeight: '25vh', m: '5%' }}>
                            <CardMedia
                                sx={{ height: '15vh', width: '100%', objectFit: 'contain', }}
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
                            </CardContent>
                        </Card >
                    );
                }
            }
            setIndependentCards(cardsArray);
        }

        fetchCategories();
        fetchCards();
    }, [studentId, cardIds]);

    useEffect(() => {
        if (category === "All") {
            setCards(independentCards);
        } else {
            const filteredCards = independentCards.filter(card => card.props['data-category-type'] === category);
            setCards(filteredCards);
        }
    }, [category, independentCards])

    const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
        setCategory(newValue);
    };

    return (
        <ThemeProvider theme={mainTheme}>
            <Box p={2}>
                <Tabs
                    value={category}
                    onChange={handleCategoryChange}
                    // variant="scrollable"
                    scrollButtons
                    variant="scrollable"
                    allowScrollButtonsMobile
                    aria-label="scrollable force tabs example"
                    sx={{
                        '& .MuiTabs-indicator': {
                            // backgroundColor: colors[categories ? Array.from(categories.values()).findIndex(cat => cat.category === category) : 0] || '#790377',
                        },
                        border: `1px solid ${mainTheme.palette.secondary.main}`,
                        borderRadius: '10px',
                        width: 'auto'
                    }}
                >
                    {categories && Array.from(categories.entries()).map(([key, value]) => (
                        <Tab
                            key={key}
                            value={value.category}
                            label={value.category}
                            sx={{
                                textTransform: "capitalize",
                            }}
                        />
                    ))}
                </Tabs>
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fill, minmax(18%, 1fr))"
                    sx={{
                        mt: '1%',
                        height: '100%',
                        width: '100%',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        rowGap: '5%',
                        columnGap: '1%',
                    }}
                >
                    {cards}
                </Box>
            </Box>
        </ThemeProvider >
    );
}

