import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { getCardCategories, getStudentCards, getUserName, removeCard } from '../functions/query';
import CardContent from '@mui/material/CardContent';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import { Tab } from '@mui/material';
import mainTheme from '../themes/Theme';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    height: '75vh',
    width: '75vw',
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 12,
    p: 4,
};

interface AdminViewCardModalProps {
    open: boolean,
    handleClose: () => void,
    studentId: string,
}


export default function AdminViewCardModal({ open, handleClose, studentId }: AdminViewCardModalProps) {
    const [categories, setCategories] = useState<Map<string, object> | null>(null);
    const [category, setCategory] = useState("All");
    const [allCards, setAllCards] = useState<React.ReactNode[]>([]); // All Cards of current user
    const [cards, setCards] = useState<React.ReactNode[]>([]); // Filtered React Element Cards
    const [deleteCardModal, setDeleteCardModal] = useState({
        isActive: false,
        cardId: '',
        cardName: '',
    });
    const [studentName, setStudentName] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            const categoryList = await getCardCategories();
            setCategories(categoryList);
        }

        const fetchCards = async () => {
            const cardsArray = [];
            let studentCards = null;
            studentCards = await getStudentCards(studentId);

            if (studentCards) {
                for (const [key, value] of studentCards) {
                    cardsArray.push(
                        <Card key={key} data-category-type={value.category} sx={{ minHeight: '25vh', maxHeight: '25vh', m: '5%' }}>
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

        const fetchStudentName = async () => {
            let newStudentName = "";
            newStudentName = await getUserName(studentId);
            setStudentName(newStudentName);
        }

        fetchCategories();
        fetchCards();
        fetchStudentName();
    }, [studentId]);

    useEffect(() => {
        if (category === "All") {
            setCards(allCards);
        } else {
            const filteredCards = allCards.filter(card => card.props['data-category-type'] === category);
            setCards(filteredCards);
        }
    }, [category, allCards])

    const deleteCard = async () => {
        try {
            await removeCard(deleteCardModal.cardId);
        } catch (error) {
            alert(error)
        }
        location.reload()
    }

    const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
        setCategory(newValue);
    };

    return (
        <>
            <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
                open={open}
                onClose={handleClose}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                }}
            >
                <Fade in={open}>
                    <Box sx={style}>
                        <Typography id="transition-modal-title" variant="h6" component="h2">
                            {`${studentName}'s Cards`}
                        </Typography>

                        {/* <Typography id="transition-modal-description" sx={{ mt: 2 }}>
                            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                        </Typography> */}

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
        </>
    );
}
