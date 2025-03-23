import { useEffect, useRef, useState } from "react";
import { Box, Button, Chip, Divider } from "@mui/material";
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import Stack from '@mui/material/Stack';
import { ordinalSuffixOf } from "../functions/ordinalSuffixOf";
import { Category } from "../pages/Ranking";
import { getMainCategoryRanking, setMainCategoryRanking } from "../functions/query";

export type MainCategory = {
    category: string;
    rank: number;
};

const buttonColors: string[] = [
    'linear-gradient(90deg, #790377 0%, #8e2de2)',
    '#ff5555', // red
    '#ffb155', // orange
    'rgba(237, 195, 7, 255)', // yellow
    '#aae173', // green
    '#55adff', // blue
    '#ab86fb', // violet
    '#e06ee2' //pink
];

interface SortableCategoryProps {
    studentId: string;
    handleSelectedCategoryChange: (newSelectedCategory: Category) => void;
}

export default function SortableCategory({ studentId, handleSelectedCategoryChange }: SortableCategoryProps) {

    const initialMainCategories = useRef<MainCategory[]>([]); // Initial main categories fetched from the server, Used to compare with the current main categories and update the server
    const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);

    useEffect(() => {
        const fetchMainCategoryRanking = async () => {
            try {
                initialMainCategories.current = await getMainCategoryRanking(studentId)
                setMainCategories(initialMainCategories.current);
            } catch (error) {
                console.error("Error fetching Main Category Ranking:", error);
            }
        };
        fetchMainCategoryRanking();
    }, [studentId]);

    useEffect(() => {
        const updateMainCategoryRanking = async () => {
            try {
                let mainCategoriesChanged = false;
                mainCategories.map(async (mainCategory, i) => {
                    if (JSON.stringify(mainCategory) !== JSON.stringify(initialMainCategories.current[i])) {
                        mainCategoriesChanged = true;
                    }
                    if (mainCategoriesChanged)
                        await setMainCategoryRanking(studentId, mainCategories.filter(category => category.category !== "Favorites"));
                });

                initialMainCategories.current = mainCategories; // Update Initial category ranking to the main category ranking, Avoids unnecessary API calls 
            } catch (error) {
                console.error("Error updating main category ranking:", error);
            }
        }
        updateMainCategoryRanking();
    }, [studentId, mainCategories]);

    // useEffect(() => {
    //     console.log(`initialMainCategories.current: ${JSON.stringify(initialMainCategories.current)}`)
    //     console.log(`mainCategories: ${JSON.stringify(mainCategories)}`)
    // }, [initialMainCategories, mainCategories]);

    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: {
            distance: 4
        },
    });
    const keyboardSensor = useSensor(KeyboardSensor);

    const sensors = useSensors(
        pointerSensor,
        keyboardSensor,
    );

    return (
        <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToHorizontalAxis]} sensors={sensors}>
            <SortableContext items={mainCategories.map(mainCategory => mainCategory.category)}>
                <Stack direction="row" spacing={3} >
                    {mainCategories.map((mainCategory, index) => (
                        <SortableMainCategory
                            mainCategory={mainCategory}
                            id={mainCategory.category}
                            buttonColor={buttonColors[index === 0 ? 0 : (index - 1) % (buttonColors.length - 1) + 1]}
                            handleSelectedCategoryChange={handleSelectedCategoryChange}
                        />
                    ))}
                </Stack>
            </SortableContext>
        </DndContext>
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setMainCategories((mainCategories) => {
                const oldIndex = mainCategories.findIndex(category => category.category === active.id);
                const newIndex = mainCategories.findIndex(category => category.category === over?.id);

                const updatedMainCategories = arrayMove(mainCategories, oldIndex, newIndex);

                return updatedMainCategories.map((category, index) => ({
                    ...category,
                    rank: index + 1,
                }));
            });
        }
    }
}

export function SortableMainCategory({ mainCategory, id, buttonColor, handleSelectedCategoryChange }: { mainCategory: MainCategory, id: string, buttonColor: string, handleSelectedCategoryChange: (newSelectedCategory: Category) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: id, animateLayoutChanges: () => false });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (id !== 'Favorites')
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column' }} gap={1}>
                <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                    <Button variant="contained" key={id}
                        onClick={() => handleSelectedCategoryChange(id as Category)}
                        sx={{
                            textTransform: 'capitalize',
                            background: buttonColor,
                            "&:hover": {
                                backgroundColor: buttonColor
                            },
                            "&:active": {
                                backgroundColor: buttonColor
                            }

                        }} >
                        {id}
                    </Button>
                </div>
                <Divider>
                    <Chip label={ordinalSuffixOf(mainCategory.rank)} size="medium"
                        sx={{
                            'color': 'white',
                            'fontWeight': '1000',
                            'backgroundColor': `${buttonColor} !important`,
                        }} />
                </Divider>
            </Box>
        )
    else
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column' }} gap={1}>
                <Button variant="contained" key={id}
                    onClick={() => handleSelectedCategoryChange(id as Category)}
                    sx={{
                        textTransform: 'capitalize',
                        background: buttonColor,
                        "&:hover": {
                            backgroundColor: buttonColor
                        },
                        "&:active": {
                            backgroundColor: buttonColor
                        }

                    }} >
                    {id}
                </Button>
                <Divider >
                    <Chip label={ordinalSuffixOf(mainCategory.rank)} size="medium"
                        sx={{
                            'color': 'white',
                            'fontWeight': '1000',
                            'background': `${buttonColor} !important`,
                        }} />
                </Divider>
            </Box>
        )
}