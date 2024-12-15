import { useEffect, useRef, useState } from "react";
import { Box, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { DndContext, DragEndEvent, } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { ordinalSuffixOf } from "../functions/ordinalSuffixOf";
import { Category } from "../pages/Ranking";
import { getCardCategoryRanking, setCardCategoryRanking } from "../functions/query";

export type CategoryCard = {
    cardID: string;
    cardTitle: string;
    imageUrl: string;
    rank: number;
};


// TODO: categoryRanking Collection delete card implementation
export default function SortableCards({ studentId, selectedCategory }: { studentId: string, selectedCategory: Category }) {
    const initialCategoryCards = useRef<{ category: Category, categoryCard: CategoryCard[] }[]>([]); // Initial main categories fetched from the server, Used to compare with the current main categories and update the server
    const [categoryCards, setCategoryCards] = useState<{ category: Category, categoryCard: CategoryCard[] }[]>([]);

    useEffect(() => {
        const fetchCardCategoryRanking = async () => {
            try {
                initialCategoryCards.current = await getCardCategoryRanking(studentId)
                setCategoryCards(initialCategoryCards.current);
            } catch (error) {
                console.error("Error fetching Card Categories Ranking:", error);
            }
        };
        fetchCardCategoryRanking();
    }, [studentId]);

    useEffect(() => {
        const updateStudentFavoriteCard = async () => {
            try {
                const filteredCategoryCards = categoryCards.filter(catCard => catCard.category === selectedCategory);
                if (filteredCategoryCards.length > 0) {
                    filteredCategoryCards[0].categoryCard.map(async (card, i) => {
                        if (JSON.stringify(card) !== JSON.stringify(initialCategoryCards.current.find(catCard => catCard.category === selectedCategory)?.categoryCard[i])) {
                            await setCardCategoryRanking(studentId, card.cardID, selectedCategory, card.rank);
                        }
                    });

                    const index = initialCategoryCards.current.findIndex(catCard => catCard.category === selectedCategory);
                    if (index !== -1) {
                        initialCategoryCards.current[index].categoryCard = filteredCategoryCards[0].categoryCard; // Update Initial favorite cards to the current favorite cards, Avoids unnecessary API calls
                    }
                }
            } catch (error) {
                console.error("Error updating student favorite cards:", error);
            }
        };

        updateStudentFavoriteCard();
    }, [studentId, categoryCards, selectedCategory]);

    // useEffect(() => {
    //     console.log(`initialCategoryCards.current: ${JSON.stringify(initialCategoryCards.current)}`)
    //     console.log(`categoryCards: ${JSON.stringify(categoryCards)}`)
    // }, [initialCategoryCards, categoryCards]);

    return (
        <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToFirstScrollableAncestor]} >
            <SortableContext
                items={categoryCards.find(categoryCard => categoryCard.category === selectedCategory)?.categoryCard.map(card => card.cardID) || []}>
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))"
                    // gridTemplateRows="minmax(150px, 2fr)"
                    sx={{
                        p: 2,
                        gridGap: 32,
                        overflowY: 'auto',
                    }}
                >
                    {categoryCards.find(categoryCard => categoryCard.category === selectedCategory)?.categoryCard.map(card => (
                        <SortableCategoryCard
                            categoryCard={card}
                        />
                    ))}
                </Box>
            </SortableContext>
        </DndContext>
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setCategoryCards((categoryCards) => {
                const categoryIndex = categoryCards.findIndex(categoryCard => categoryCard.category === selectedCategory);
                const oldIndex = categoryCards[categoryIndex].categoryCard.findIndex(card => card.cardID === active.id);
                const newIndex = categoryCards[categoryIndex].categoryCard.findIndex(card => card.cardID === over?.id);

                const updatedCategoryCards = [...categoryCards];
                updatedCategoryCards[categoryIndex].categoryCard = arrayMove(categoryCards[categoryIndex].categoryCard, oldIndex, newIndex);

                return updatedCategoryCards.map((category) => ({
                    ...category,
                    categoryCard: category.categoryCard.map((card, cardIndex) => ({
                        ...card,
                        rank: cardIndex + 1,
                    })),
                }));
            });
        }
    }
}

export function SortableCategoryCard({ categoryCard }: { categoryCard: CategoryCard }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: categoryCard.cardID, animateLayoutChanges: () => false });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card key={categoryCard.cardID}
                sx={{
                    minHeight: 'min-content', maxHeight: '100%', height: 'min-content',
                    ':hover': {
                        cursor: 'grab'
                    },
                }} >
                <CardMedia
                    sx={{
                        height: '150px',
                        width: '250px',
                        // backgroundFill: 'cover',
                        // objectFit: 'contain',
                    }}
                    image={categoryCard.imageUrl}
                    title={categoryCard.cardTitle}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography gutterBottom variant="h6" component="h6">
                        {categoryCard.cardTitle}
                    </Typography>
                    <Typography gutterBottom variant="subtitle1" >
                        {`Rank: ${ordinalSuffixOf(categoryCard.rank)}`}
                    </Typography>
                </CardContent>
            </Card>
        </div>
    )
}