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

const numberWord: string[] = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

export default function Favorites({ studentId }: { studentId: string }) {
    const initialFavoriteCards = useRef<Card[]>([]); // Initial favorite cards fetched from the server, Used to compare with the current favorite cards and update the server
    const [favoriteCards, setFavoriteCards] = useState<Card[]>([]);

    useEffect(() => {
        const fetchStudentFavoriteCards = async () => {
            try {
                initialFavoriteCards.current = await getStudentFavoriteCards(studentId)
                setFavoriteCards(initialFavoriteCards.current);
                console.log('done fetching favorite cards');
            } catch (error) {
                console.error("Error fetching student favorite cards:", error);
            }
        };
        fetchStudentFavoriteCards();
    }, [studentId]);

    // useEffect(() => {
    //     console.log(favoriteCards);
    // }, [favoriteCards]);

    useEffect(() => {
        const updateStudentFavoriteCard = async () => {
            try {
                favoriteCards.map(async (card, i) => {
                    if (JSON.stringify(card) !== JSON.stringify(initialFavoriteCards.current[i]))
                        setStudentFavoriteCardRank(studentId, card.cardID, card.rank);
                });

                initialFavoriteCards.current = favoriteCards; // Update Initial favorite cards to the current favorite cards, Avoids unnecessary API calls
            } catch (error) {
                console.error("Error updating student favorite cards:", error);
            }
        }

        updateStudentFavoriteCard();
    }, [studentId, favoriteCards]);

    return (
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
            <Card key={card.cardID}
                sx={{
                    minHeight: 'min-content', maxHeight: '100%', height: 'min-content',
                    ':hover': {
                        cursor: 'grab'
                    },
                }} >
                <CardMedia
                    sx={{ height: '12vh', objectFit: 'contain' }}
                    image={card.imageUrl}
                    title={card.title}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography gutterBottom variant="h6" component="h6">
                        {card.title}
                    </Typography>
                    <Typography gutterBottom variant="subtitle1" >
                        {`Rank: ${numberWord[card.rank - 1]}`}
                    </Typography>
                    <Typography gutterBottom variant="subtitle1" >
                        {`Category: ${card.category}`}
                    </Typography>
                </CardContent>
            </Card>
        </div>
    )
}