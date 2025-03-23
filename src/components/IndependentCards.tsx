import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { getCardCategories, getStudentCards, getStudentCardsUsingIds } from '../functions/query';
import CardContent from '@mui/material/CardContent';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Tabs from '@mui/material/Tabs';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Tab, ThemeProvider } from '@mui/material';
import mainTheme from '../themes/Theme';

interface IndependentCardProps {
    studentId: string,
    cardIds: string[],
}


export default function IndependentCards({ studentId, cardIds }: IndependentCardProps) {
    const [categories, setCategories] = useState<Map<string, { category: string }> | null>(null);
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [allCards, setAllCards] = useState<React.ReactNode[]>([]); // All Cards of current user
    const [filteredCards, setFilteredCards] = useState<React.ReactNode[]>([]); // Filtered React Element Cards
    const [cardIndependenceFilter, setCardIndependenceFilter] = useState("Independent");

    useEffect(() => {
        const fetchCategories = async () => {
            const categoryList = await getCardCategories();
            setCategories(categoryList);
        }

        const fetchCards = async () => {
            const cardsArray = [];
            let studentCards = null;
            // studentCards = await getStudentCardsUsingIds(studentId, cardIds);
            studentCards = await getStudentCards(studentId);

            if (studentCards) {
                for (const [key, value] of studentCards) {
                    cardsArray.push(
                        <Card key={key} data-category-type={value.category} data-card-id={key} sx={{ minHeight: '25vh', maxHeight: '25vh', m: '5%' }}>
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
            setAllCards(cardsArray);
        }

        fetchCategories();
        fetchCards();
    }, [studentId, cardIds]);

    useEffect(() => {
        let filteredCards = allCards;

        if (cardIndependenceFilter === "Dependent") {
            filteredCards = allCards.filter(card => !cardIds.includes(card.props['data-card-id']));
        } else if (cardIndependenceFilter === "Independent") {
            filteredCards = allCards.filter(card => cardIds.includes(card.props['data-card-id']));
        }

        if (categoryFilter !== "All")
            filteredCards = filteredCards.filter(card => card.props['data-category-type'] === categoryFilter);

        setFilteredCards(filteredCards);

    }, [allCards, cardIds, categoryFilter, cardIndependenceFilter])

    const handleCategoryFilterChange = (event: React.SyntheticEvent, newValue: string) => {
        setCategoryFilter(newValue);
    };

    const handleCardIndependenceFilterChange = (event: SelectChangeEvent) => {
        setCardIndependenceFilter(event.target.value as string);
    };

    return (
        <ThemeProvider theme={mainTheme}>
            <Box p={2}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                    <Tabs
                        value={categoryFilter}
                        onChange={handleCategoryFilterChange}
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
                            width: 'min-content',
                            height: 'min-content',
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
                    <FormControl >
                        <InputLabel id="demo-simple-select-label">Filter</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={cardIndependenceFilter}
                            label="Prompt Filter"
                            onChange={handleCardIndependenceFilterChange}
                        >
                            <MenuItem value={"All"}>All</MenuItem>
                            <MenuItem value={"Dependent"}>Dependent</MenuItem>
                            <MenuItem value={"Independent"}>Independent</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

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
                    {filteredCards}
                </Box>
            </Box>
        </ThemeProvider >
    );
}

