import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import mainTheme from "../themes/Theme";
import { useEffect, useState } from "react";
import { getCardCategories, getOtherStudentCards, getStudentCards, getStudentLatestEmotion, getStudentSentences, removeCard, removeStudent, setCard, setEmotion, setEmotionDays, setImage } from "../functions/query";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Backdrop, Button, Card, CardActions, CardContent, CardMedia, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fade, FormControl, IconButton, InputLabel, MenuItem, Modal, Select, TextField } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { ThemeProvider } from "@emotion/react";
import addImageIcon from '../assets/add_image_icon 1.png';

// const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
const addCardModalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    height: '70vh',
    width: '70vw',
    bgcolor: 'background.paper',
    // border: '2px solid #000',
    borderRadius: '8px',
    boxShadow: 12,
    p: 4,
};

interface CardsProps {
    studentId: string;
    guardianId: string;
}

export default function Cards(props: CardsProps) {
    const [categories, setCategories] = useState<Map<string, object> | null>(null);
    const [category, setCategory] = useState("All");
    const [addCardModal, setAddCardModal] = useState(false);
    const [deleteCardModal, setDeleteCardModal] = useState({
        isActive: false,
        cardId: '',
        cardName: '',
    });
    const [inputCardName, setInputCardName] = useState("");
    const [inputCategory, setInputCategory] = useState("");
    const [inputImage, setInputImage] = useState<Blob | null>(null);
    const [inputCardUrl, setInputCardUrl] = useState("");
    const [doneButton, setDoneButton] = useState(false);
    const [allCards, setAllCards] = useState<React.ReactNode[]>([]); // All Cards of current user
    const [cards, setCards] = useState<React.ReactNode[]>([]); // Filtered React Element Cards
    const [otherCards, setOtherCards] = useState<React.ReactNode[]>([]); // Cards that current user doesnt contain
    // const [isSettingEmotion, setIsSettingEmotion] = useState(false);

    const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
        setCategory(newValue);
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
                    imageUrl: "",
                    tapCount: 0,
                    title: inputCardName,
                    userId: props.studentId,
                }
                await setCard(card_data, cardRef);
            }
            else if (inputCardUrl) { // Clicking other user cards
                const card_data = {
                    category: inputCategory,
                    imageUrl: inputCardUrl,
                    tapCount: 0,
                    title: inputCardName,
                    userId: props.studentId,
                }
                await setCard(card_data);
            }

        } catch (error) {
            alert(error)
        }
        location.reload()
    }

    const deleteCard = async () => {
        try {
            await removeCard(deleteCardModal.cardId);
        } catch (error) {
            alert(error)
        }
        location.reload()
    }

    useEffect(() => {
        const fetchCategories = async () => {
            const categoryList = await getCardCategories();
            setCategories(categoryList);
        }

        const fetchCards = async () => {
            const cardsArray = [];
            let studentCards = null;
            studentCards = await getStudentCards(props.studentId);

            if (studentCards) {
                for (const [key, value] of studentCards) {
                    cardsArray.push(
                        <Card key={key} data-category-type={value.category} sx={{ maxHeight: '25vh', minWidth: '25vh', marginBottom: '20px' }}>
                            <CardMedia
                                sx={{ height: '15vh', width: '100%', objectFit: 'contain', }}
                                image={value.imageUrl}
                                title={value.title}
                            />
                            <CardContent sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography gutterBottom variant="h5" component="h5">
                                    {value.title}
                                </Typography>
                                <IconButton aria-label="delete" size="medium" color='error' sx={{ pt: "0" }} onClick={() => setDeleteCardModal({ isActive: true, cardId: key, cardName: value.title })}>
                                    <DeleteIcon fontSize="inherit" />
                                </IconButton>
                            </CardContent>
                        </Card >
                    );
                }
            }
            setAllCards(cardsArray);
        }

        const fetchOtherCards = async () => {
            const otherCardsArray = [];
            let studentOtherCards = null;
            studentOtherCards = await getOtherStudentCards(props.studentId);

            if (studentOtherCards) {
                for (const [key, value] of studentOtherCards) {
                    otherCardsArray.push(
                        <Card key={key} data-category-type={value.category} onClick={() => { setInputImage(null); setInputCardUrl(value.imageUrl); setInputCardName(value.title); setInputCategory(value.category); }} sx={{ minHeight: '20vh', minWidth: '100%', m: '5%' }}>
                            <CardMedia
                                sx={{ height: '60%', objectFit: 'contain' }}
                                image={`${value.imageUrl}?height=100`}
                                title={value.title}
                            />
                            <CardContent sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography gutterBottom variant="h6" component="h6">
                                    {value.title}
                                </Typography>
                            </CardContent>
                        </Card >
                    );
                }
            }
            setOtherCards(otherCardsArray);
        }

        fetchCategories();
        fetchCards();
        fetchOtherCards();
    }, [props.studentId,]);

    useEffect(() => {
        if (category === "All") {
            setCards(allCards);
        } else {
            const filteredCards = allCards.filter(card => card.props['data-category-type'] === category);
            setCards(filteredCards);
        }
    }, [category, allCards])


    useEffect(() => {
        if (inputCardName && inputCategory && (inputImage || inputCardUrl)) {
            setDoneButton(false);
        } else {
            setDoneButton(true);
        }
    }, [inputCardName, inputCategory, inputImage, inputCardUrl]);

    return (
        <Box display='flex' flexDirection='column' justifyContent='flex-start' width={'100%'} height={'100%'} flex={1}
            sx={{
            }}
        >
            <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
                open={addCardModal}
                onClose={() => setAddCardModal(false)}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                }}
            >
                <Fade in={addCardModal}>
                    <Box sx={addCardModalStyle}>
                        <Box display='flex' flexDirection='row' justifyContent='space-between'>
                            <Typography id="transition-modal-title" variant="h5" component="h2" color={mainTheme.palette.primary.main}>
                                Add Cards
                            </Typography>
                            <IconButton aria-label="close" onClick={() => setAddCardModal(false)}>
                                <CloseIcon fontSize="large" sx={{ color: mainTheme.palette.secondary.main }} />
                            </IconButton>
                        </Box>
                        <Box display='flex' flexDirection='row' justifyContent='space-between' mt={'4%'} width={'100%'} height={'100%'}>
                            {/* <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='space-around' border={`1px solid ${mainTheme.palette.primary.main}`}
                                sx={{
                                    overflowX: 'auto', overflowY: 'auto',
                                    mt: '1%', p: '1%',
                                    width: '48%', height: '80%',
                                }} >
                                
                                <Typography id="transition-modal-title" variant="h6" component="h2" color={mainTheme.palette.primary.main}
                                    sx={{
                                        m: '3%'
                                    }}>
                                    Other Cards
                                </Typography>
                                {otherCards}

                            </Box> */}
                            <Box
                                display="flex"
                                flexDirection="row"
                                flexWrap="wrap"
                                justifyContent="space-around"
                                border={`1px solid ${mainTheme.palette.primary.main}`}
                                sx={{
                                    position: 'relative', // Make the box relative for absolute positioning inside
                                    overflowX: 'auto',
                                    overflowY: 'auto',
                                    mt: '1%',
                                    p: '1%',
                                    width: '48%',
                                    height: '80%',
                                }}
                            >
                                <Typography
                                    id="transition-modal-title"
                                    variant="h6"
                                    component="h2"
                                    color={mainTheme.palette.primary.main}
                                    sx={{
                                        position: 'absolute',
                                        top: '0',
                                        left: '0',
                                        m: '3%', // Margin for positioning away from the edges
                                    }}
                                >
                                    Other Cards
                                </Typography>

                                <Box
                                    display="grid"
                                    gridTemplateColumns="repeat(auto-fill, minmax(30%, 1fr))"
                                    gap="5%"
                                    sx={{
                                        mt: '10%', // To push the grid below the Typography
                                        width: '100%',
                                        height: 'auto',
                                        overflowX: 'clip',
                                    }}
                                >
                                    {otherCards}
                                </Box>
                            </Box>

                            <Box display='flex' flexDirection='column' justifyContent='space-between' width={'48%'} height={'80%'}>
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
                                    border={`4px dashed ${inputImage ? mainTheme.palette.primary.main : `#ababab`}`}
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
                                        ) : inputCardUrl ? (
                                            <>
                                                <img
                                                    srcSet={inputCardUrl}
                                                    src={inputCardUrl}
                                                    alt={`${inputCardName}-picture`}
                                                    loading="lazy"
                                                    height='150px'
                                                />
                                            </>
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
                                <Box display='flex' flexDirection='row' justifyContent='flex-end' width={'100%'} mt={'2%'}>
                                    <Button disabled={doneButton} variant="contained" sx={{ textTransform: "capitalize" }} onClick={uploadCard}>Done</Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Fade>
            </Modal>

            <Dialog
                open={deleteCardModal.isActive}
                onClose={() => setDeleteCardModal({ isActive: false, cardId: '', cardName: '' })}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    <b>{`Delete Student Card: ${deleteCardModal.cardName}`}</b>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete card from student? This action can not be reversed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteCardModal({ isActive: false, cardId: '', cardName: '' })} sx={{ backgroundColor: "#c1c1c1" }} variant="contained">Cancel</Button>
                    <Button onClick={deleteCard} autoFocus color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>




            <Typography variant="h6" component="div"
                sx={{
                    textTransform: "capitalize",
                    color: mainTheme.palette.primary.main,
                }}
            >
                {`Current Cards`}
            </Typography>

            <Box display='flex' flexDirection='row' justifyContent='space-between'
                sx={{
                    width: '100%',
                }}
            >
                <Tabs
                    value={category}
                    onChange={handleCategoryChange}
                    variant="scrollable"
                    scrollButtons
                    allowScrollButtonsMobile
                    aria-label="scrollable force tabs example"
                    sx={{
                        '& .MuiTabs-indicator': {
                            // backgroundColor: colors[category % colors.length], // Change indicator color based on the active tab
                        },
                    }}
                >
                    {categories && Array.from(categories.entries()).map(([key, value], index) => (
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
                <Button disabled={otherCards.length === 0} variant="contained" onClick={() => setAddCardModal(true)} sx={{ textTransform: 'capitalize' }}>Add Card +</Button>
            </Box>

            <Box flex={1} display='flex' flexDirection='row' flexWrap='wrap' justifyContent='space-around'
                sx={{
                    overflowX: 'auto', overflowY: 'auto',
                    mt: '1%', p: '1%',

                }}
            >
                {cards}     {/* {Make this part Scrollable} */}
            </Box>

        </Box >
    );
}