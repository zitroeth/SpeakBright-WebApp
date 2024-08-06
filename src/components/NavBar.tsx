import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { IconButton, ThemeProvider, Tooltip } from '@mui/material';
import { mainTheme, gradientTheme } from '../themes/Theme';
import speakBrightLogo from '../assets/SpeakBright 1.png';

export default function NavBar() {
    return (
        <ThemeProvider theme={mainTheme}>
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static" sx={{
                    background: `linear-gradient(90deg, ${gradientTheme.palette.primary.main} 0%, ${gradientTheme.palette.secondary.main} 100%)`,
                }}
                >
                    <Toolbar sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        // width: '100%',
                        flexGrow: 1,
                        padding: '0% 5% !important', // Use pixel values for testing
                    }}>
                        <div style={{
                            flex: 1,
                        }}>
                            <img src={speakBrightLogo} alt="SpeakBright Logo"
                                style={{
                                    height: "100px",
                                }}
                            >
                            </img>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flex: 1,
                        }}>
                            <div id="HAC"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flex: 1,
                                    padding: "0% 20%",
                                }}>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    aria-label=""
                                    href="/"
                                    sx={{
                                        mr: 3,
                                        "&.MuiButtonBase-root:hover": {
                                            bgcolor: "transparent",
                                            color: mainTheme.palette.secondary.light,
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        sx={{
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        Home
                                    </Typography>
                                </IconButton>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    aria-label="About"
                                    href="/About"
                                    sx={{
                                        mr: 3,
                                        "&.MuiButtonBase-root:hover": {
                                            bgcolor: "transparent",
                                            color: mainTheme.palette.secondary.light,
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        sx={{
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        About
                                    </Typography>
                                </IconButton>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    aria-label="Contact Us"
                                    href="/Contact"
                                    sx={{
                                        mr: 3,
                                        "&.MuiButtonBase-root:hover": {
                                            bgcolor: "transparent",
                                            color: mainTheme.palette.secondary.light,
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        sx={{
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        Contact Us
                                    </Typography>
                                </IconButton>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    href="/Login"
                                    sx={{
                                        backgroundColor: 'white',
                                        color: '#790377', // Text color to match the primary color
                                        borderColor: '#790377', // Border color to match the primary color
                                        '&:hover': {
                                            backgroundColor: '#e0e0e0', // Slightly darker white
                                            borderColor: '#6b0053', // Slightly darker border color on hover
                                        },
                                    }}>
                                    Login</Button>
                            </div>

                        </div>

                    </Toolbar>
                </AppBar>
            </Box>
        </ThemeProvider >
    );
}