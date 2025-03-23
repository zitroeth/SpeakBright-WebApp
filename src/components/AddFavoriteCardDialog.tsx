import { forwardRef, ReactElement, Ref, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import Box from '@mui/material/Box';
import addImageIcon from '../assets/add_image_icon 1.png';
import { FormControl, InputLabel, MenuItem, Select, TextField, ThemeProvider, Typography } from '@mui/material';
import mainTheme from '../themes/Theme';
import { getCardCategories, getCardId, setCard, setCardFavorite, setImage } from '../functions/query';
import { getDownloadURL, StorageReference } from 'firebase/storage';

const Transition = forwardRef(function Transition(
    props: TransitionProps & {
        children: ReactElement<any, any>;
    },
    ref: Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface AddFavoriteCardDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    favoriteCardCount: number;
    studentId: string;
}

export default function AddFavoriteCardDialog({ open, setOpen, favoriteCardCount, studentId }: AddFavoriteCardDialogProps) {
    const [categories, setCategories] = useState<Map<string, { category: string }> | null>(null);
    const [inputCardName, setInputCardName] = useState("");
    const [inputCategory, setInputCategory] = useState("");
    const [inputImage, setInputImage] = useState<Blob | null>(null);
    const [doneButton, setDoneButton] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            const categoryList = await getCardCategories();
            setCategories(categoryList);
        }
        fetchCategories();
    }, []);

    useEffect(() => {
        if (inputCardName && inputCategory && inputImage) {
            setDoneButton(false);
        } else {
            setDoneButton(true);
        }
    }, [inputCardName, inputCategory, inputImage]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setInputImage(file);
        }
    };

    const uploadCard = async () => {
        const uniqueFileName: string = Date.now().toString();
        try {
            if (inputImage != null) { // Manual card input
                const cardRef = await setImage(uniqueFileName, inputImage as Blob);
                const card_data = {
                    category: inputCategory,
                    imageUrl: undefined,
                    tapCount: 0,
                    phase1_independence: false,
                    phase2_independence: false,
                    phase3_independence: false,
                    title: inputCardName,
                    userId: studentId,
                }
                await setCard(card_data, cardRef);
                const newImageUrl = await getDownloadURL(cardRef as StorageReference);
                const cardId = await getCardId(inputCategory, newImageUrl, 0, inputCardName, studentId);
                await setCardFavorite(studentId, { cardID: cardId, category: inputCategory, imageUrl: newImageUrl, title: inputCardName }, true);
            }
        } catch (error) {
            alert(error)
        }
        location.reload()
    }

    return (
        <>
            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>{`Add 10+ favorite cards (${favoriteCardCount}/10)`}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        <Box display='flex' flexDirection='row' justifyContent='space-between' width={'100%'}>
                            <ThemeProvider theme={mainTheme}>
                                <TextField value={inputCardName} label="Card Name" id="card-name-input" sx={{ width: '48%' }} onChange={(e) => setInputCardName(e.target.value as string)} />
                                <FormControl sx={{ width: '48%' }}>
                                    <InputLabel id="category-simple-select-label">Category</InputLabel>
                                    <Select
                                        labelId="category-simple-select-label"
                                        id="category-simple-select"
                                        value={inputCategory}
                                        label="Category"
                                        onChange={(e) => setInputCategory(e.target.value as string)}
                                    >
                                        {categories && Array.from(categories.entries()).map(([key, value]) => (
                                            value.category === "All" ? null : (
                                                <MenuItem key={key} value={value.category}>
                                                    {value.category}
                                                </MenuItem>
                                            )
                                        ))}
                                    </Select>
                                </FormControl>
                            </ThemeProvider>
                        </Box>

                        <Box
                            display='flex'
                            borderRadius={8}
                            width={'100%'}
                            height={'100%'}
                            my={'2%'}
                        >
                            <label htmlFor="upload-image"
                                style={{
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                    height: '100%', width: '100%',
                                    cursor: 'pointer'
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e)}
                                    style={{ display: "none" }}
                                    id="upload-image"
                                />
                                {inputImage ? (
                                    <img
                                        src={URL.createObjectURL(inputImage)}
                                        alt="Selected"
                                        style={{ height: "150px", objectFit: "contain" }}
                                    />
                                ) : (<>
                                    <img
                                        srcSet={addImageIcon}
                                        src={addImageIcon}
                                        alt={'add-image-icon'}
                                        loading="lazy"
                                        height='150px'
                                    />
                                    <Typography variant="h6" component="div" sx={{ textTransform: "capitalize", }}> Add Photo </Typography>
                                </>)
                                }

                            </label>
                        </Box>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button disabled={doneButton} variant="contained" sx={{ textTransform: "capitalize" }} onClick={uploadCard}>Done</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}