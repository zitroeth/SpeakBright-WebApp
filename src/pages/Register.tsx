import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import speakBrightLogo from '../assets/SpeakBright_PL 3 CROP.png';
import TextField from '@mui/material/TextField';
import { ThemeProvider } from '@emotion/react';
import { mainTheme } from '../themes/Theme';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import grey from '@mui/material/colors/grey';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { auth, db, secondaryAuth, secondaryDb } from '../config/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Timestamp, doc, setDoc } from 'firebase/firestore'; // Import from Firebase
import useAuth, { checkIfDocumentExists } from '../hooks/useAuth';
import LoadingButton from '@mui/lab/LoadingButton';

dayjs.extend(utc);
dayjs.extend(timezone);


export default function Register() {
    const { currentUser, loading } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [birthday, setBirthday] = useState<Timestamp | undefined>(undefined);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [guardian, setGuardian] = useState(true);

    const handleGuardian = () => {
        setGuardian(!guardian);
    };
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleDateChange = (value: dayjs.Dayjs | null) => {
        if (value) {
            // Convert dayjs object to JavaScript Date
            const jsDate = value.toDate();
            // Convert JavaScript Date to Firebase Timestamp
            const firebaseTimestamp = Timestamp.fromDate(jsDate);
            setBirthday(firebaseTimestamp);
        } else {
            setBirthday(undefined);
        }
    };

    const register = async () => {
        try {
            // await signInWithEmailAndPassword(auth, email, password);
            if (name.trim() === "") {
                throw new Error('Enter a name!');
            }

            if (email.trim() === "") {
                throw new Error('Enter an email!');
            }
            if (!email.toLowerCase()
                .match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
                throw new Error('Incorrect email format!');
            }

            if (birthday === undefined) {
                throw new Error('Enter a birthday!');
            }

            if (password.trim() === "") {
                throw new Error('Enter a password!');
            }

            if (confirmPassword.trim() === "") {
                throw new Error('Enter confirm password!');
            }
            if (confirmPassword !== password) {
                throw new Error('Password must be the same!');
            }

            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const uid = userCredential.user.uid;

            const users_data = {
                birthday: birthday,
                email: email,
                name: name,
                userID: uid,
            }

            await setDoc(doc(secondaryDb, "users", uid), users_data);
            if (guardian === true) {
                if (secondaryAuth?.currentUser?.uid) {
                    // Incase documentID != guardianID
                    const doesDocumentExist: boolean = await checkIfDocumentExists("user_guardian", secondaryAuth.currentUser.uid, secondaryDb);
                    if (doesDocumentExist)
                        throw new Error("Document Exists!");
                    await setDoc(doc(secondaryDb, "user_guardian", uid), users_data);
                }
                else
                    throw new Error('Authentication error!');
            } else if (guardian === false) {
                if (secondaryAuth?.currentUser?.uid && auth?.currentUser?.uid) {
                    // Incase documentID != guardianID
                    const doesDocumentExist: boolean = await checkIfDocumentExists("user_guardian", auth.currentUser.uid, secondaryDb);
                    if (!doesDocumentExist)
                        throw new Error("Guardian Document does not exist!");
                    // Reference to the specific student document within the student subcollection
                    const studentDocRef = doc(secondaryDb, 'user_guardian', auth.currentUser.uid, 'students', secondaryAuth.currentUser.uid);
                    await setDoc(studentDocRef, users_data);
                }
                else
                    throw new Error('Authentication error!');
            }

            await signOut(secondaryAuth);
            alert("User created successfully!");
        } catch (error) {
            alert(error);
        }
    }

    return (
        <ThemeProvider theme={mainTheme}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    flex: '1 1 auto',
                    '& > :not(style)': {
                        m: 1,
                        width: '35%',
                        height: '85%',
                    },
                }}
            >
                <Paper elevation={20}
                    sx={{
                        borderRadius: '32px',
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                    <img src={speakBrightLogo} alt="SpeakBright Logo" id='input-logo'
                        style={{
                            width: "80%",
                            margin: '0% 5% 10% 5%',
                        }}
                    ></img>
                    <ButtonGroup variant="contained" aria-label="Basic button group" sx={{ width: '80%', marginBottom: '5px', }}>
                        {loading ? (<LoadingButton loading
                            variant="outlined"
                            color="primary"
                            sx={{
                                backgroundColor: 'white',
                                color: '#790377',
                                borderColor: '#790377',
                                '&:hover': {
                                    backgroundColor: '#e0e0e0',
                                    borderColor: '#6b0053',
                                },
                            }}
                        >
                            Loading...
                        </LoadingButton>) :
                            currentUser ? (<>
                                <Button onClick={handleGuardian}
                                    sx={{
                                        flex: 1,
                                        textAlign: 'center',
                                        backgroundColor: guardian ? grey[200] : mainTheme.palette.primary.main,
                                        color: guardian ? grey[900] : grey[50],

                                    }}>Student
                                </Button>
                                <Button onClick={handleGuardian}
                                    sx={{
                                        flex: 1,
                                        textAlign: 'center',
                                        backgroundColor: !guardian ? grey[200] : mainTheme.palette.primary.main,
                                        color: !guardian ? grey[900] : grey[50]
                                    }}>Guardian
                                </Button></>
                            ) : (
                                <Button
                                    sx={{
                                        flex: 1,
                                        textAlign: 'center',
                                        backgroundColor: !guardian ? grey[200] : mainTheme.palette.primary.main,
                                        color: !guardian ? grey[900] : grey[50]
                                    }}>Guardian
                                </Button>
                            )
                        }
                    </ButtonGroup>

                    <TextField label="Name" sx={{ width: '80%' }} margin="dense" onChange={(e) => setName(e.target.value)} />
                    <TextField label="Email" sx={{ width: '80%' }} margin="dense" onChange={(e) => setEmail(e.target.value)} />
                    <DatePicker label="Birthday" sx={{ width: '80%' }} format="LL" onChange={handleDateChange} />
                    <FormControl sx={{ m: 1, width: '80%' }} variant="outlined" margin="dense">
                        <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                        <OutlinedInput
                            onChange={(e) => setPassword(e.target.value)}
                            id="outlined-adornment-password"
                            type={showPassword ? 'text' : 'password'}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                            label="Password"
                        />
                    </FormControl>
                    <FormControl sx={{ m: 1, width: '80%' }} variant="outlined" margin="dense">
                        <InputLabel htmlFor="outlined-adornment-password">Confirm Password</InputLabel>
                        <OutlinedInput
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            id="outlined-adornment-confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                            label="Password"
                        />
                    </FormControl>
                    <Button id='register-button' variant="contained" sx={{ marginTop: '4%', width: '80%' }} onClick={register}>Register</Button>

                </Paper>
            </Box>
        </ThemeProvider>

    );
}