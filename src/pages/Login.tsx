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
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { checkIfDocumentExists } from '../hooks/useAuth';


export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const signIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (auth.currentUser?.uid) {
                const isGuardian = await checkIfDocumentExists("user_guardian", auth.currentUser?.uid);
                if (!isGuardian) {
                    signOut(auth);
                    throw new Error("Cannot use student login!");
                }
            }

            window.location.href = '/Home';
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
                        height: '70%',
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
                    }}
                    className='login-paper'>
                    <img src={speakBrightLogo} alt="SpeakBright Logo" id='input-logo'
                        style={{
                            width: "80%",
                            margin: '10%',
                        }}
                    ></img>

                    <TextField label="Email" sx={{ width: '80%' }} margin="dense" onChange={(e) => setEmail(e.target.value)} />
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
                    <Button variant="contained" sx={{ marginTop: '10%', width: '80%', textTransform: 'capitalize' }} onClick={signIn}>Login</Button>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            margin: '15px',
                            color: mainTheme.palette.primary.light,
                        }}
                    >
                        Don't have an account?{' '}
                        <Link to="/Register" style={{ color: mainTheme.palette.primary.light, textDecoration: 'none' }}>
                            <b>Register here</b>
                        </Link>
                    </Typography>
                </Paper>
            </Box>
        </ThemeProvider>

    );
}