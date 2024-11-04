import { useEffect, useState } from "react";
import { Box, Button, FormControl, IconButton, MenuItem, SelectChangeEvent, ThemeProvider, Tooltip, Typography } from "@mui/material";
import mainTheme from "../themes/Theme";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import TransitionsModal from "../components/TransitionModal";
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CloseIcon from '@mui/icons-material/Close';
import SelectLabels from "../components/SelectLabels";

interface Card {
    cardID: string;
    category: string;
    imageUrl: string;
    rank: number;
    title: string;
}

const cards: Card[] = [
    {
        cardID: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
        category: 'CategoryA',
        imageUrl: '',
        title: '1st',
        rank: 1,
    },
    {
        cardID: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
        category: 'CategoryB',
        imageUrl: '',
        title: '2nd',
        rank: 2,
    },
    {
        cardID: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
        category: 'CategoryC',
        imageUrl: '',
        title: '3rd',
        rank: 3,
    },
    {
        cardID: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
        category: 'CategoryD',
        imageUrl: '',
        title: '4th',
        rank: 4,
    },
    {
        cardID: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
        category: 'CategoryE',
        imageUrl: '',
        title: '5th',
        rank: 5,
    },
    {
        cardID: '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u',
        category: 'CategoryF',
        imageUrl: '',
        title: '6th',
        rank: 6,
    },
    {
        cardID: '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v',
        category: 'CategoryG',
        imageUrl: '',
        title: '7th',
        rank: 7,
    },
    {
        cardID: '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w',
        category: 'CategoryH',
        imageUrl: '',
        title: '8th',
        rank: 8,
    },
    {
        cardID: '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x',
        category: 'CategoryI',
        imageUrl: '',
        title: '9th',
        rank: 9,
    },
    {
        cardID: '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y',
        category: 'CategoryJ',
        imageUrl: '',
        title: '10th',
        rank: 10,
    },
];

const numberWord: string[] = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export default function TestPDND() {
    const [favoriteCards, setFavoriteCards] = useState<Card[]>(cards);

    return (
        <Box sx={{
            width: '100vw',
            height: 'auto',
            boxSizing: 'border-box',
            padding: '5vh 1vw',
        }}>
            <Box sx={{
                boxSizing: 'border-box',
                border: '2px solid #e8e8e8',
                height: '47vh',
                width: '95%',
                padding: '1%',
            }}>
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(5, 1fr)"
                    sx={{
                        height: '100%',
                        width: '100%',
                        overflowY: 'auto',
                        gap: '5%',
                        boxSizing: 'border-box',
                        p: '1%',
                    }}
                >
                    {favoriteCards.map((card) => (
                        <FavoriteCard
                            key={card.cardID}
                            card={card}
                            favoriteCards={favoriteCards}
                            setFavoriteCards={setFavoriteCards}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    )
}

export function FavoriteCard({ card, favoriteCards, setFavoriteCards }: { card: Card, favoriteCards: Card[], setFavoriteCards: (cards: Card[]) => void }) {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [newRanking, setNewRanking] = useState('');
    const handleChange = (event: SelectChangeEvent) => {
        setNewRanking(event.target.value);
    };

    useEffect(() => {
        if (newRanking) {
            let newFavoriteCards = [...favoriteCards];
            const index = newFavoriteCards.findIndex((c) => c.cardID === card.cardID);

            setNewRanking('');
            setFavoriteCards(newFavoriteCards);
        }
    }, [newRanking]);

    return (
        <Card key={card.cardID} onClick={() => { }}
            sx={{ minHeight: 'min-content', maxHeight: '100%', height: 'min-content', }} >
            <CardMedia
                sx={{ height: '12vh', objectFit: 'contain' }}
                image={`https://picsum.photos/id/5${card.rank}/500/300`}
                title={card.title}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography gutterBottom variant="h6" component="h6">
                    {card.title}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >
                    <Typography gutterBottom variant="subtitle1" >
                        {`Rank: ${card.rank}`}
                    </Typography>
                    <ThemeProvider theme={mainTheme}>
                        <Tooltip title="Change Ranking">
                            <IconButton aria-label="rank" size="medium" color='secondary' sx={{ pt: "0" }} onClick={handleOpen}>
                                <FormatListNumberedIcon />
                            </IconButton>
                        </Tooltip>
                    </ThemeProvider>
                </Box>
            </CardContent>
            <RankingModal open={open} handleClose={handleClose} ranking={card.rank.toString()} handleChange={handleChange} />
        </Card>
    )
}

function RankingModal({ open, handleClose, ranking, handleChange }: { open: boolean, handleClose: () => void, ranking: string, handleChange: (event: SelectChangeEvent) => void }) {
    return (
        <TransitionsModal open={open} handleClose={handleClose}>
            <ThemeProvider theme={mainTheme}>
                <Box display='flex' flexDirection='row' justifyContent='space-between' height='fit-content'>
                    <Typography id="transition-modal-title" variant="h5" color="primary" py={1} mr={2}>
                        Change Card Favorites Ranking
                    </Typography>
                    <IconButton aria-label="close" onClick={handleClose} color="secondary">
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </Box>

                <Box display='flex' flexDirection='row' justifyContent='space-between' height='fit-content' mt={3} alignItems='center'>
                    <SelectLabels label="Rank" ranking={ranking} handleChange={handleChange}>
                        {cards.map((card) => (<MenuItem key={card.cardID} value={card.rank}>{numberWord[card.rank - 1]}</MenuItem>))}
                    </SelectLabels >
                    <Button variant="contained" sx={{ textTransform: 'capitalize', height: 'fit-content', }}
                        onClick={() => {
                            handleClose();
                        }}>
                        Update
                    </Button>
                </Box>
            </ThemeProvider>
        </TransitionsModal >
    );
}