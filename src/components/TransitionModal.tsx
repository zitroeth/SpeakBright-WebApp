import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import { ReactNode } from 'react';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    height: 'min-content',//
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 12,
    p: 4,
};

interface TransitionsModalProps {
    open: boolean;
    handleClose: () => void;
    children: ReactNode;
}

export default function TransitionsModal({ open, handleClose, children }: TransitionsModalProps) {
    return (
        <div>
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
                        {/* <Typography id="transition-modal-title" variant="h6" component="h2">
                            Text in a modal
                        </Typography>
                        <Typography id="transition-modal-description" sx={{ mt: 2 }}>
                            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                        </Typography> */}
                        {children}
                    </Box>
                </Fade>
            </Modal>
        </div>
    );
}