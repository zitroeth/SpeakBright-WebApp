import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import mainTheme from "../themes/Theme";
import { useEffect, useMemo, useState } from "react";
import { getCardCategories, getFavoriteCardIds, getOtherStudentCards, getStudentCards, removeCard, setCard, setCardFavorite, setImage } from "../functions/query";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Backdrop, Button, Card, CardContent, CardMedia, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fade, FormControl, IconButton, InputLabel, MenuItem, Modal, Select, TextField, Tooltip } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { ThemeProvider } from "@emotion/react";
import addImageIcon from '../assets/add_image_icon 1.png';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

// const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
const addCardModalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    height: '75vh',
    width: '75vw',
    bgcolor: 'background.paper',
    // border: '2px solid #000',
    borderRadius: '8px',
    boxShadow: 12,
    p: 4,
};

interface CardsProps {
    studentId: string;
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
    const [filterOtherCards, setFilterOtherCards] = useState({
        textFilter: '',
        categoryFilter: 'All',
    });
    const [favoriteCardIds, setFavoriteCardIds] = useState<string[]>([]);


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
                    imageUrl: undefined,
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
                        <Card key={key} data-category-type={value.category} data-id={key} sx={{ minHeight: '25vh', maxHeight: '25vh', m: '5%' }}>
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

                                <ThemeProvider theme={mainTheme}>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>
                                        <IconButton aria-label="favorite" size="medium" color="primary" sx={{ pt: "0" }}
                                            onClick={() => {
                                                if (favoriteCardIds.length <= 3 && favoriteCardIds.includes(key)) {
                                                    alert("You must have 3 favorite cards");
                                                }
                                                else if (favoriteCardIds.length >= 10 && !favoriteCardIds.includes(key)) {
                                                    alert("You can only have 10 favorite cards");
                                                } else {
                                                    setCardFavorite(props.studentId, { cardID: key, category: value.category, imageUrl: value.imageUrl, title: value.title }, !favoriteCardIds.includes(key))
                                                        .then(() => {
                                                            setFavoriteCardIds(favoriteCardIds.includes(key) ? favoriteCardIds.filter(id => id !== key) : [...favoriteCardIds, key]);
                                                        })
                                                        .catch(error => {
                                                            console.error("Error updating favorite status: ", error);
                                                        });
                                                }
                                            }}>
                                            {favoriteCardIds.includes(key) ?
                                                <Tooltip title="Remove from favorites">
                                                    <FavoriteIcon fontSize="inherit" />
                                                </Tooltip>
                                                :
                                                <Tooltip title="Add to favorites">
                                                    <FavoriteBorderIcon fontSize="inherit" />
                                                </Tooltip>
                                            }
                                        </IconButton>
                                        <Tooltip title="Delete">
                                            <IconButton aria-label="delete" size="medium" color='error' sx={{ pt: "0" }} onClick={() => setDeleteCardModal({ isActive: true, cardId: key, cardName: value.title })}>
                                                <DeleteIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                </ThemeProvider>
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
                        <Card key={key} data-category-type={value.category} onClick={() => { setInputImage(null); setInputCardUrl(value.imageUrl); setInputCardName(value.title); setInputCategory(value.category); }}
                            sx={{ minHeight: '25vh', minWidth: '95%', maxHeight: '25vh', m: '5%' }}>
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
    }, [props.studentId, favoriteCardIds]);

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

    const filteredOtherCards = useMemo(() => {
        const newOtherCards = otherCards.filter(card => {
            const cardTitle = card.props.children[0].props.title.toLowerCase();
            const categoryType = card.props['data-category-type'];

            const textMatch = !filterOtherCards.textFilter.trim().toLowerCase() || cardTitle.includes(filterOtherCards.textFilter.trim().toLowerCase());
            const categoryMatch = filterOtherCards.categoryFilter === 'All' || categoryType === filterOtherCards.categoryFilter;

            return textMatch && categoryMatch;
        });
        return newOtherCards;
    }, [otherCards, filterOtherCards])


    useEffect(() => {
        const fetchFavoriteCardIds = async () => {
            const favoriteCardsArray = await getFavoriteCardIds(props.studentId);
            console.log(favoriteCardsArray)
            setFavoriteCardIds(favoriteCardsArray);
        }

        fetchFavoriteCardIds();
    }, [props.studentId]);

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
                        <Box display='flex' flexDirection='row' justifyContent='space-between' height='fit-content'>
                            <Typography id="transition-modal-title" variant="h5" component="h2" color={mainTheme.palette.primary.main}>
                                Add Cards
                            </Typography>
                            <IconButton aria-label="close" onClick={() => setAddCardModal(false)}>
                                <CloseIcon fontSize="large" sx={{ color: mainTheme.palette.secondary.main }} />
                            </IconButton>
                        </Box>
                        <Box display='flex' flexDirection='row' justifyContent='space-between' mt={'1%'} width={'100%'} height={'100%'}>
                            <Box
                                display="flex"
                                flexDirection="row"
                                flexWrap="wrap"
                                justifyContent="flex-start"
                                border={`1px solid ${mainTheme.palette.primary.main}`}
                                sx={{
                                    p: '1%',
                                    width: '48%',
                                    height: '85%',
                                    overflowY: 'hidden',
                                }}
                            >
                                <Box
                                    display="flex"
                                    flexDirection="row"
                                    justifyContent="space-between"
                                    sx={{
                                        mt: '1%',
                                        p: '1%',
                                        width: '100%',
                                        height: 'fit-content'
                                    }}
                                >
                                    <Typography
                                        id="transition-modal-title"
                                        variant="h6"
                                        component="h2"
                                        color={mainTheme.palette.primary.main}
                                        sx={{
                                        }}
                                    >
                                        Other Cards
                                    </Typography>
                                    <Box
                                        display="flex"
                                        flexDirection="row"
                                        justifyContent="flex-end"
                                        sx={{
                                            p: '1%',
                                            width: '80%',
                                        }}
                                    >
                                        <ThemeProvider theme={mainTheme}>
                                            <TextField value={filterOtherCards.textFilter} label="Search cards..." id="other-card-text-filter" sx={{ width: '48%' }} onChange={(e) => setFilterOtherCards({ ...filterOtherCards, textFilter: e.target.value as string })} />
                                            <FormControl sx={{ ml: '5%', minWidth: '15%' }}>
                                                <InputLabel id="other-card-category-filter-simple-select-label">Category</InputLabel>
                                                <Select
                                                    labelId="other-card-category-filter-simple-select-label"
                                                    id="other-card-category-filter-simple-select"
                                                    value={filterOtherCards.categoryFilter}
                                                    label="Other Card Category Filter"
                                                    onChange={(e) => setFilterOtherCards({ ...filterOtherCards, categoryFilter: e.target.value as string })}
                                                    autoWidth
                                                >
                                                    {categories && Array.from(categories.entries()).map(([key, value]) => (
                                                        <MenuItem key={`${key}-filter`} value={value.category}>
                                                            {value.category}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </ThemeProvider>
                                    </Box>
                                </Box>

                                <Box
                                    display="grid"
                                    gridTemplateColumns="repeat(auto-fill, minmax(30%, 1fr))"
                                    sx={{
                                        height: '80%',
                                        width: '100%',
                                        overflowX: 'auto',
                                        overflowY: 'auto',
                                        rowGap: '1%',
                                        columnGap: '5%',
                                    }}
                                >
                                    {filteredOtherCards}
                                </Box>
                            </Box>

                            <Box display='flex' flexDirection='column' justifyContent='space-between' width={'48%'} height={'85%'}>
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
                                    border={`4px dashed ${!doneButton ? mainTheme.palette.primary.main : `#ababab`}`}
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




            <Box display='flex' flexDirection='row' justifyContent='space-between'
                sx={{
                    width: '100%',
                }}
            >
                <Tabs
                    value={category}
                    onChange={handleCategoryChange}
                    // variant="scrollable"
                    scrollButtons
                    allowScrollButtonsMobile
                    aria-label="scrollable force tabs example"
                    sx={{
                        '& .MuiTabs-indicator': {
                            // backgroundColor: colors[categories ? Array.from(categories.values()).findIndex(cat => cat.category === category) : 0] || '#790377',
                        },
                        border: `1px solid ${mainTheme.palette.secondary.main}`,
                        borderRadius: '10px',
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

            {/* <Box flex={1} display='flex' flexDirection='row' flexWrap='wrap' justifyContent='space-around'
                sx={{
                    overflowX: 'auto', overflowY: 'auto',
                    mt: '1%', p: '1%',
                }}
            >
                {cards}
            </Box> */}
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
        </Box >
    );
}