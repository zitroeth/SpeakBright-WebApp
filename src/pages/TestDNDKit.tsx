import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { getStudentFavoriteCards, setStudentFavoriteCardRank } from "../functions/query";

interface Card {
    cardID: string;
    category: string;
    imageUrl: string;
    rank: number;
    title: string;
}

const cards: Card[] = [
    {
        cardID: 'id1',
        category: 'CategoryA',
        imageUrl: '',
        title: 'title1',
        rank: 1,
    },
    {
        cardID: 'id2',
        category: 'CategoryB',
        imageUrl: '',
        title: 'title2',
        rank: 2,
    },
    {
        cardID: 'id3',
        category: 'CategoryC',
        imageUrl: '',
        title: 'title3',
        rank: 3,
    },
    {
        cardID: 'id4',
        category: 'CategoryD',
        imageUrl: '',
        title: 'title4',
        rank: 4,
    },
    {
        cardID: 'id5',
        category: 'CategoryE',
        imageUrl: '',
        title: 'title5',
        rank: 5,
    },
    {
        cardID: 'id6',
        category: 'CategoryF',
        imageUrl: '',
        title: 'title6',
        rank: 6,
    },
    {
        cardID: 'id7',
        category: 'CategoryG',
        imageUrl: '',
        title: 'title7',
        rank: 7,
    },
    {
        cardID: 'id8',
        category: 'CategoryH',
        imageUrl: '',
        title: 'title8',
        rank: 8,
    },
    {
        cardID: 'id9',
        category: 'CategoryI',
        imageUrl: '',
        title: 'title9',
        rank: 9,
    },
    {
        cardID: 'id10',
        category: 'CategoryJ',
        imageUrl: '',
        title: 'title10',
        rank: 10,
    },
];

const numberWord: string[] = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

export default function TestDNDKit() {
    // const initialFavoriteCards = useRef<Card[]>([]); // Initial favorite cards fetched from the server, Used to compare with the current favorite cards and update the server
    const [favoriteCards, setFavoriteCards] = useState<Card[]>(cards);

    // useEffect(() => {
    //     const fetchStudentFavoriteCards = async () => {
    //         try {
    //             initialFavoriteCards.current = await getStudentFavoriteCards()
    //             console.log(initialFavoriteCards.current);
    //         } catch (error) {
    //             console.error("Error fetching student favorite cards:", error);
    //         }
    //     };
    //     fetchStudentFavoriteCards();
    // }, []);

    // useEffect(() => {
    //     console.log(favoriteCards);
    // }, [favoriteCards]);

    // useEffect(() => {
    //     const updateStudentFavoriteCard = async () => {
    //         try {
    //             favoriteCards.map(async (card, i) => {
    //                 if (JSON.stringify(card) !== JSON.stringify(initialFavoriteCards.current[i]))
    //                     setStudentFavoriteCardRank();
    //             });
    //         } catch (error) {
    //             console.error("Error updating student favorite cards:", error);
    //         }

    //         // initialFavoriteCards.current = favoriteCards; // Update Initial favorite cards to the current favorite cards, Avoids unnecessary API calls
    //     }

    //     updateStudentFavoriteCard();
    // }, [favoriteCards]);

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
                <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToFirstScrollableAncestor]}>
                    <SortableContext items={favoriteCards.map(card => card.cardID)}>
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
                                    id={card.cardID}
                                    card={card}
                                />
                            ))}
                        </Box>
                    </SortableContext>
                </DndContext>
            </Box>
        </Box>
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setFavoriteCards((cards) => {
                const oldIndex = cards.findIndex(card => card.cardID === active.id);
                const newIndex = cards.findIndex(card => card.cardID === over?.id);

                const updatedCards = arrayMove(cards, oldIndex, newIndex);

                return updatedCards.map((card, index) => ({
                    ...card,
                    rank: index + 1,
                }));
            });
        }
    }
}

export function FavoriteCard({ card, id }: { card: Card, id: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card
                sx={{ minHeight: 'min-content', maxHeight: '100%', height: 'min-content' }}
            >
                <CardMedia
                    sx={{ height: '12vh', objectFit: 'contain' }}
                    image={`https://picsum.photos/id/5${card.rank}/500/300`}
                    title={card.title}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography gutterBottom variant="h6" component="h6">
                        {card.title}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Typography gutterBottom variant="subtitle1">
                            {`Rank: ${numberWord[card.rank - 1]}`}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </div>
    );
}