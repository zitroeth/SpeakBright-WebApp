import Box from '@mui/material/Box'
import SortableCategory from '../components/SortableCategory'
import SortableCards from '../components/SortableCards'
import { useState } from 'react';


export type Category =
    'Favorites' |
    'Food' |
    'Toys' |
    'Emotions' |
    'School' |
    'Activities' |
    'Chores' |
    'Clothing' |
    'People' |
    'Places';

export default function Ranking({ studentId }: { studentId: string }) {
    const [selectedCategory, setSelectedCategory] = useState<Category>('Favorites');

    const handleSelectedCategoryChange = (newSelectedCategory: Category) => {
        setSelectedCategory(newSelectedCategory);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                // p: 4,
                gap: 4,
            }}
        >
            <SortableCategory studentId={studentId} handleSelectedCategoryChange={handleSelectedCategoryChange} />
            <SortableCards studentId={studentId} selectedCategory={selectedCategory} />
        </Box>
    )
}
